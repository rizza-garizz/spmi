<?php

return [
    'name' => env('APP_NAME', 'SPMI'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'key' => env('APP_KEY'),
    'cipher' => 'AES-256-CBC',
    'url' => env('APP_URL', 'http://localhost'),
    'timezone' => 'Asia/Bangkok',
    'locale' => 'id',
    'fallback_locale' => 'en',
    'faker_locale' => 'id_ID',
];
