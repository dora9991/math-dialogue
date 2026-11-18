<?php
declare(strict_types=1);

// テストを全部動かす：php tests/run.php [ファイル名の一部]
// テスト用の DB（既定 127.0.0.1:3306 の hub_test）の中身は、毎回消します。

require __DIR__ . '/lib.php';

$filter = $argv[1] ?? '';
T::freshSchema();
$files = glob(__DIR__ . '/*Test.php') ?: [];
sort($files);
$started = microtime(true);
$count = 0;
foreach ($files as $file) {
    if ($filter !== '' && !str_contains(basename($file), $filter)) {
        continue;
    }
    $tests = require $file;
    foreach ($tests as $name => $fn) {
        T::$current = basename($file, '.php') . ' › ' . $name;
        T::truncateAll();
        $count++;
        try {
            $fn();
        } catch (\Throwable $e) {
            T::$fails[] = '[' . T::$current . '] 例外: ' . get_class($e) . ': ' . $e->getMessage() . ' (' . basename($e->getFile()) . ':' . $e->getLine() . ")\n" . $e->getTraceAsString();
        }
    }
}
$sec = round(microtime(true) - $started, 1);
foreach (T::$fails as $f) {
    echo "✗ {$f}\n";
}
echo ($count) . ' テスト・' . T::$pass . ' 確認 OK・' . count(T::$fails) . " 失敗（{$sec}秒）\n";
exit(T::$fails ? 1 : 0);
