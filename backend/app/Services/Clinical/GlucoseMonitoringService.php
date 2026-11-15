<?php

namespace App\Services\Clinical;

/**
 * NutriCare AI - Glucose Monitoring & Clinical Escalation Service
 * Adheres to American Diabetes Association (ADA) 2026 Standards of Care.
 */
class GlucoseMonitoringService
{
    public const MMOL_CONVERSION_FACTOR = 18.0182;

    /**
     * Converts mg/dL to mmol/L.
     */
    public static function mgDlToMmolL(float $mgDl): float
    {
        return round($mgDl / self::MMOL_CONVERSION_FACTOR, 2);
    }

    /**
     * Converts mmol/L to mg/dL.
     */
    public static function mmolLToMgDl(float $mmolL): float
    {
        return round($mmolL * self::MMOL_CONVERSION_FACTOR, 1);
    }

    /**
     * Evaluates a glucose reading against ADA clinical safety guidelines.
     * 
     * @param float $valueMgDl Reading in mg/dL
     * @param string $context 'fasting', 'pre_meal', 'post_meal_2h', 'bedtime'
     * @return array Clinical categorization, escalation flags, and actionable guidance
     */
    public function evaluateReading(float $valueMgDl, string $context = 'pre_meal'): array
    {
        $valueMmolL = self::mgDlToMmolL($valueMgDl);

        // 1. SEVERE HYPOGLYCEMIA (ADA Level 2: < 54 mg/dL / 3.0 mmol/L)
        if ($valueMgDl < 54.0) {
            return [
                'status' => 'CRITICAL_HYPOGLYCEMIA',
                'severity' => 'EMERGENCY',
                'is_escalated' => true,
                'value_mg_dl' => $valueMgDl,
                'value_mmol_l' => $valueMmolL,
                'alert_title' => 'Critical Low Blood Sugar Alert (< 54 mg/dL)',
                'action_instructions' => 'URGENT: Take 15g fast-acting sugar immediately (half glass fruit juice, regular soda, or 4 glucose tablets). If unable to safely swallow or feeling disoriented, call emergency medical services immediately.',
                'requires_clinician_notify' => true
            ];
        }

        // 2. CLINICAL HYPOGLYCEMIA (ADA Level 1: 54 - 69 mg/dL / 3.0 - 3.8 mmol/L)
        if ($valueMgDl < 70.0) {
            return [
                'status' => 'HYPOGLYCEMIA',
                'severity' => 'URGENT',
                'is_escalated' => true,
                'value_mg_dl' => $valueMgDl,
                'value_mmol_l' => $valueMmolL,
                'alert_title' => 'Low Blood Sugar (Rule of 15 Required)',
                'action_instructions' => 'Follow Rule of 15: Consume 15g fast-acting carbohydrate (e.g. 1/2 cup juice or 3 glucose tablets). Rest and re-check blood glucose in 15 minutes. Do not exercise or drive.',
                'requires_clinician_notify' => true
            ];
        }

        // 3. SEVERE HYPERGLYCEMIA (> 300 mg/dL / 16.7 mmol/L)
        if ($valueMgDl > 300.0) {
            return [
                'status' => 'SEVERE_HYPERGLYCEMIA',
                'severity' => 'CRITICAL',
                'is_escalated' => true,
                'value_mg_dl' => $valueMgDl,
                'value_mmol_l' => $valueMmolL,
                'alert_title' => 'Critical High Blood Sugar (> 300 mg/dL)',
                'action_instructions' => 'Drink plenty of water. Check for urine ketones if test strips are available. Contact your diabetic care team or physician.',
                'requires_clinician_notify' => true
            ];
        }

        // 4. MODERATE ELEVATION (> 180 mg/dL post-meal or > 130 mg/dL fasting)
        $isElevated = ($context === 'fasting' && $valueMgDl > 130.0) || ($valueMgDl > 180.0);
        if ($isElevated) {
            return [
                'status' => 'ELEVATED',
                'severity' => 'CAUTION',
                'is_escalated' => false,
                'value_mg_dl' => $valueMgDl,
                'value_mmol_l' => $valueMmolL,
                'alert_title' => 'Above Target Range',
                'action_instructions' => 'Slightly above target. Ensure adequate hydration and review carbohydrate intake from previous meal.',
                'requires_clinician_notify' => false
            ];
        }

        // 5. IN TARGET RANGE (70 - 130 mg/dL fasting or < 180 mg/dL post-meal)
        return [
            'status' => 'IN_TARGET',
            'severity' => 'NORMAL',
            'is_escalated' => false,
            'value_mg_dl' => $valueMgDl,
            'value_mmol_l' => $valueMmolL,
            'alert_title' => 'Optimal Target Range',
            'action_instructions' => 'Well done! Reading is within recommended diabetic target range.',
            'requires_clinician_notify' => false
        ];
    }
}
