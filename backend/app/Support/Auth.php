<?php

namespace App\Support;

/**
 * Stateless HMAC-SHA256 signed bearer tokens (JWT-style, HS256).
 */
class Auth
{
    private const TTL_SECONDS = 60 * 60 * 12;

    public static function secret(string $storageDir): string
    {
        $env = getenv('APP_SECRET');
        if ($env) {
            return $env;
        }
        $file = $storageDir . '/.app_secret';
        if (!file_exists($file)) {
            file_put_contents($file, bin2hex(random_bytes(32)));
        }
        return trim(file_get_contents($file));
    }

    private static function b64(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function unb64(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/')) ?: '';
    }

    public static function issue(array $user, string $secret): string
    {
        $header = self::b64(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = self::b64(json_encode([
            'sub' => $user['id'],
            'role' => $user['role'],
            'iat' => time(),
            'exp' => time() + self::TTL_SECONDS,
        ]));
        $sig = self::b64(hash_hmac('sha256', "$header.$payload", $secret, true));
        return "$header.$payload.$sig";
    }

    /** Returns the token payload or null when invalid/expired. */
    public static function verify(string $token, string $secret): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$header, $payload, $sig] = $parts;
        $expected = self::b64(hash_hmac('sha256', "$header.$payload", $secret, true));
        if (!hash_equals($expected, $sig)) {
            return null;
        }
        $data = json_decode(self::unb64($payload), true);
        if (!is_array($data) || ($data['exp'] ?? 0) < time()) {
            return null;
        }
        return $data;
    }

    public static function bearerToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!$header && function_exists('getallheaders')) {
            foreach (getallheaders() as $k => $v) {
                if (strcasecmp($k, 'Authorization') === 0) {
                    $header = $v;
                }
            }
        }
        if (preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) {
            return $m[1];
        }
        return null;
    }
}
