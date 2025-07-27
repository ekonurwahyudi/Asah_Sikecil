<?php
// File untuk implementasi rate limiting sederhana

function checkRateLimit($ip, $endpoint, $limit = 10, $period = 60) {
    $cacheFile = sys_get_temp_dir() . '/rate_limit_' . md5($ip . '_' . $endpoint) . '.json';
    
    // Baca data rate limit yang ada
    if (file_exists($cacheFile)) {
        $data = json_decode(file_get_contents($cacheFile), true);
    } else {
        $data = ['count' => 0, 'timestamp' => time()];
    }
    
    // Reset counter jika periode sudah berlalu
    if (time() - $data['timestamp'] > $period) {
        $data = ['count' => 1, 'timestamp' => time()];
        file_put_contents($cacheFile, json_encode($data));
        return true;
    }
    
    // Cek apakah melebihi batas
    if ($data['count'] >= $limit) {
        return false;
    }
    
    // Tambah counter
    $data['count']++;
    file_put_contents($cacheFile, json_encode($data));
    return true;
}