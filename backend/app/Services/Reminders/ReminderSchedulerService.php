<?php

namespace App\Services\Reminders;

use DateTime;
use DateTimeZone;

/**
 * NutriCare AI - Meal & Medication Reminder Scheduler Service
 */
class ReminderSchedulerService
{
    /**
     * Calculates the next reminder occurrence timestamp in patient's timezone.
     * 
     * @param string $scheduledTime e.g. "12:30:00"
     * @param string $timezone e.g. "Africa/Lagos" or "America/New_York"
     * @return DateTime
     */
    public function calculateNextTargetTime(string $scheduledTime, string $timezone = 'Africa/Lagos'): DateTime
    {
        $tz = new DateTimeZone($timezone);
        $now = new DateTime('now', $tz);

        $targetToday = new DateTime($now->format('Y-m-d') . ' ' . $scheduledTime, $tz);

        if ($targetToday > $now) {
            return $targetToday;
        }

        // Target already passed today; schedule for tomorrow
        $targetTomorrow = clone $targetToday;
        $targetTomorrow->modify('+1 day');
        return $targetTomorrow;
    }

    /**
     * Calculates a snoozed target time.
     * 
     * @param DateTime $currentTime
     * @param int $snoozeMinutes (15, 30, 60)
     * @return DateTime
     */
    public function calculateSnoozeTime(DateTime $currentTime, int $snoozeMinutes = 15): DateTime
    {
        $snoozeTime = clone $currentTime;
        $snoozeTime->modify("+{$snoozeMinutes} minutes");
        return $snoozeTime;
    }

    /**
     * Formats notification payload for push notification (FCM/WebPush).
     */
    public function buildPushPayload(array $reminder, array $upcomingMeal): array
    {
        $mealType = ucfirst($reminder['meal_type'] ?? 'Meal');
        $recipeTitle = $upcomingMeal['title'] ?? 'Your planned healthy meal';
        $portion = $upcomingMeal['portion_g'] ?? 250;
        $carbs = $upcomingMeal['carbs_g'] ?? 30;

        return [
            'notification' => [
                'title' => "Time for {$mealType}! 🥗",
                'body' => "Planned: {$recipeTitle} ({$portion}g · {$carbs}g carbs). Tap to log or view recipe.",
                'icon' => '/icons/icon-192x192.png',
                'badge' => '/icons/badge.png',
            ],
            'data' => [
                'type' => 'MEAL_REMINDER',
                'meal_type' => $reminder['meal_type'],
                'recipe_id' => $upcomingMeal['recipe_id'] ?? null,
                'planned_meal_id' => $upcomingMeal['planned_meal_id'] ?? null,
                'click_action' => '/dashboard',
                'scheduled_time' => $reminder['scheduled_time'] ?? null
            ]
        ];
    }
}
