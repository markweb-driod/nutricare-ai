<?php

namespace App\Support;

use App\Database\SeedData;

/**
 * File-backed JSON state store with an exclusive lock held for the request.
 * Keeps the demo dependency-free while preventing lost writes.
 */
class StateStore
{
    private string $file;
    /** @var resource|null */
    private $handle = null;
    public array $state = [];

    public function __construct(string $file)
    {
        $this->file = $file;
        if (!is_dir(dirname($file))) {
            mkdir(dirname($file), 0775, true);
        }
    }

    public function open(): void
    {
        $this->handle = fopen($this->file, 'c+');
        if (!$this->handle) {
            throw new \RuntimeException('Unable to open state storage');
        }
        flock($this->handle, LOCK_EX);
        $raw = stream_get_contents($this->handle);
        $decoded = $raw ? json_decode($raw, true) : null;

        // Fresh install, corrupt file, or pre-v2 (single-patient) layout -> reseed.
        if (!is_array($decoded) || ($decoded['schema_version'] ?? 0) < 2) {
            $decoded = SeedData::buildInitialState();
            $this->state = $decoded;
            $this->save();
        }
        $this->state = $decoded;
    }

    public function save(): void
    {
        ftruncate($this->handle, 0);
        rewind($this->handle);
        fwrite($this->handle, json_encode($this->state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        fflush($this->handle);
    }

    public function close(): void
    {
        if ($this->handle) {
            flock($this->handle, LOCK_UN);
            fclose($this->handle);
            $this->handle = null;
        }
    }

    public function audit(string $actor, string $action, string $detail = ''): void
    {
        array_unshift($this->state['audit_log'], [
            'id' => self::newId('aud'),
            'at' => date('Y-m-d H:i:s'),
            'actor' => $actor,
            'action' => $action,
            'detail' => $detail,
        ]);
        $this->state['audit_log'] = array_slice($this->state['audit_log'], 0, 500);
    }

    public static function newId(string $prefix): string
    {
        return $prefix . '-' . bin2hex(random_bytes(6));
    }
}
