<?php
declare(strict_types=1);

final class Db
{
    private static ?PDO $pdo = null;

    public static function conn(): PDO
    {
        if (self::$pdo instanceof PDO) return self::$pdo;
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
        );
        self::$pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        self::$pdo->exec("SET time_zone = '+00:00'");
        return self::$pdo;
    }

    /** @param array<string, mixed> $params */
    public static function run(string $sql, array $params = []): PDOStatement
    {
        $stmt = self::conn()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    /** @param array<string, mixed> $params @return array<int, array<string, mixed>> */
    public static function all(string $sql, array $params = []): array
    {
        return self::run($sql, $params)->fetchAll();
    }

    /** @param array<string, mixed> $params @return array<string, mixed>|null */
    public static function one(string $sql, array $params = []): ?array
    {
        $row = self::run($sql, $params)->fetch();
        return $row === false ? null : $row;
    }

    /**
     * Insert or update a row keyed by primary key.
     * @param array<string, mixed> $data
     */
    public static function insert(string $table, array $data): void
    {
        $cols = array_keys($data);
        $placeholders = array_map(fn($c) => ':' . $c, $cols);
        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $table,
            implode(', ', $cols),
            implode(', ', $placeholders)
        );
        self::run($sql, self::normalize($data));
    }

    /**
     * @param array<string, mixed> $data
     * @param array<string, mixed> $where
     */
    public static function update(string $table, array $data, array $where): int
    {
        $set = [];
        $params = [];
        foreach ($data as $k => $v) {
            $set[] = "$k = :s_$k";
            $params["s_$k"] = self::normalizeValue($v);
        }
        $whereSql = [];
        foreach ($where as $k => $v) {
            $whereSql[] = "$k = :w_$k";
            $params["w_$k"] = self::normalizeValue($v);
        }
        $sql = sprintf(
            'UPDATE %s SET %s WHERE %s',
            $table,
            implode(', ', $set),
            implode(' AND ', $whereSql)
        );
        return self::run($sql, $params)->rowCount();
    }

    /** UUID v4 (36 chars) */
    public static function uuid(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        $hex = bin2hex($bytes);
        return sprintf(
            '%s-%s-%s-%s-%s',
            substr($hex, 0, 8),
            substr($hex, 8, 4),
            substr($hex, 12, 4),
            substr($hex, 16, 4),
            substr($hex, 20, 12)
        );
    }

    /** @param array<string, mixed> $data @return array<string, mixed> */
    private static function normalize(array $data): array
    {
        $out = [];
        foreach ($data as $k => $v) $out[$k] = self::normalizeValue($v);
        return $out;
    }

    private static function normalizeValue(mixed $v): mixed
    {
        if (is_array($v) || (is_object($v) && !($v instanceof \DateTimeInterface))) {
            return json_encode($v, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }
        if ($v instanceof \DateTimeInterface) {
            return $v->format('Y-m-d H:i:s');
        }
        if (is_bool($v)) return $v ? 1 : 0;
        return $v;
    }
}
