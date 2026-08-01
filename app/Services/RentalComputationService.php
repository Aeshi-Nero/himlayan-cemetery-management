<?php

namespace App\Services;

class RentalComputationService
{
    public const NEW_LOT_FEE = 2000;

    public const ORDINANCE_PERIODS = [
        'pre_2002'     => ['label' => 'Before 2002', 'max_year' => 2001],
        '2002_2013'    => ['label' => '2002 - 2013', 'max_year' => 2013],
        '2013_present' => ['label' => '2013 - Present', 'max_year' => null],
    ];

    public const INDIVIDUAL_RATES = [
        ['max_year' => 2001, 'annual' => 20, 'decade' => 200],
        ['max_year' => 2013, 'annual' => 70, 'decade' => 700],
        ['max_year' => null, 'annual' => 200, 'decade' => 2000],
    ];

    public const FAMILY_RATES = [
        ['max_year' => 2001, 'annual' => 8],
        ['max_year' => 2013, 'annual' => 28],
        ['max_year' => null, 'annual' => 80],
    ];

    public static function ordinancePeriods(): array
    {
        return self::ORDINANCE_PERIODS;
    }

    public static function rateForPeriod(string $ordinancePeriod, string $lotType): array
    {
        $period = self::ORDINANCE_PERIODS[$ordinancePeriod] ?? self::ORDINANCE_PERIODS['2013_present'];
        $rates = $lotType === 'family' ? self::FAMILY_RATES : self::INDIVIDUAL_RATES;

        foreach ($rates as $rate) {
            if (($period['max_year'] === null && $rate['max_year'] === null)
                || ($period['max_year'] !== null && $rate['max_year'] === $period['max_year'])) {
                return $rate;
            }
        }

        return end($rates);
    }

    public function computeRenewalByOrdinance(string $ordinancePeriod, string $lotType, ?float $area = null, int $termYears = 10): array
    {
        $rate = self::rateForPeriod($ordinancePeriod, $lotType);
        $isFamily = $lotType === 'family';

        if ($isFamily) {
            $annual = round(($area ?? 1) * $rate['annual'], 2);
            $total = round($annual * $termYears, 2);
            $breakdown = number_format($area ?? 1, 2).' sqm x ₱'.$rate['annual'].'/sqm/yr x '.$termYears.' yrs = ₱'.number_format($total, 2);
        } else {
            $annual = (float) $rate['annual'];
            $total = $annual * $termYears;
            $breakdown = '₱'.$annual.'/yr x '.$termYears.' yrs = ₱'.number_format($total, 2);
        }

        return [
            'type' => 'renewal',
            'ordinance_period' => $ordinancePeriod,
            'fee' => $total,
            'years' => $termYears,
            'annual' => $annual,
            'annual_rate' => (float) $rate['annual'],
            'breakdown' => $breakdown,
        ];
    }

    public function computeBackRent(int $yearEstablished, string $lotType, ?float $area = null): array
    {
        $currentYear = (int) now()->year;

        if ($yearEstablished >= $currentYear) {
            return [
                'type' => 'new',
                'fee' => self::NEW_LOT_FEE,
                'years' => 10,
                'annual_rate' => null,
                'breakdown' => 'New lot fee: ₱'.number_format(self::NEW_LOT_FEE, 2),
            ];
        }

        $isFamily = $lotType === 'family';
        $yearsOccupied = $currentYear - $yearEstablished;
        $rates = $isFamily ? self::FAMILY_RATES : self::INDIVIDUAL_RATES;

        $total = 0;
        $remainingYears = $yearsOccupied;
        $breakdownParts = [];
        $currentCheckYear = $yearEstablished;

        foreach ($rates as $rate) {
            if ($remainingYears <= 0) {
                break;
            }

            $rateEndYear = $rate['max_year'] ?? $currentYear;
            $yearsInBracket = min($remainingYears, $rateEndYear - $currentCheckYear + 1);
            if ($yearsInBracket <= 0) {
                $currentCheckYear = $rateEndYear + 1;
                continue;
            }

            if ($isFamily) {
                $bracketTotal = $area * $yearsInBracket * $rate['annual'];
                $breakdownParts[] = number_format($area, 2).' sqm x '.$yearsInBracket.' yrs x ₱'.$rate['annual'].'/yr = ₱'.number_format($bracketTotal, 2);
            } else {
                $bracketTotal = $yearsInBracket * $rate['annual'];
                $breakdownParts[] = $yearsInBracket.' yrs x ₱'.$rate['annual'].'/yr = ₱'.number_format($bracketTotal, 2);
            }

            $total += $bracketTotal;
            $remainingYears -= $yearsInBracket;
            $currentCheckYear = $rateEndYear + 1;
        }

        return [
            'type' => 'back_rent',
            'fee' => round($total, 2),
            'years' => $yearsOccupied,
            'annual_rate' => null,
            'breakdown' => implode(' + ', $breakdownParts).' = ₱'.number_format(round($total, 2), 2),
        ];
    }

    public function computeForwardRenewal(string $lotType, ?float $area = null, int $termYears = 10): array
    {
        $isFamily = $lotType === 'family';
        $currentRates = $isFamily ? self::FAMILY_RATES[2] : self::INDIVIDUAL_RATES[2];

        if ($isFamily) {
            $annual = round(($area ?? 1) * $currentRates['annual'], 2);
            $total = round($annual * $termYears, 2);
            $breakdown = number_format($area ?? 1, 2).' sqm x ₱'.$currentRates['annual'].'/sqm/yr x '.$termYears.' yrs = ₱'.number_format($total, 2);
        } else {
            $annual = (float) $currentRates['annual'];
            $total = $annual * $termYears;
            $breakdown = '₱'.$annual.'/yr x '.$termYears.' yrs = ₱'.number_format($total, 2);
        }

        return [
            'type' => 'forward_renewal',
            'fee' => $total,
            'years' => $termYears,
            'annual' => $annual,
            'annual_rate' => (float) $currentRates['annual'],
            'breakdown' => $breakdown,
        ];
    }

    public function compute(int $yearEstablished, string $lotType, ?float $area = null): array
    {
        $currentYear = (int) now()->year;

        if ($yearEstablished >= $currentYear) {
            return [
                'type' => 'new',
                'fee' => self::NEW_LOT_FEE,
                'years' => 10,
                'annual' => null,
                'breakdown' => 'New lot fee: ₱'.number_format(self::NEW_LOT_FEE, 2),
            ];
        }

        return $this->computeBackRent($yearEstablished, $lotType, $area);
    }

    public function computeDecadeRenewal(string $lotType, ?float $area = null): float
    {
        return $this->computeForwardRenewal($lotType, $area, 10)['fee'];
    }
}
