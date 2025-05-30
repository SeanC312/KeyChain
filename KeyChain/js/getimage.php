<?php

// Uses SerpAPI to get google image result
$domain = $_GET['domain'];
// API key used in demonstration, hidden to public
$apiKey = '123abc';
$query = urlencode($domain);
$url = "https://serpapi.com/search.json?q=$query&tbm=isch&api_key=$apiKey";

$response = file_get_contents($url);
$data = json_decode($response, true);

if (isset($data['images_results'][0]['thumbnail'])) {
    echo json_encode([
        'success' => true,
        'image' => $data['images_results'][0]['thumbnail']
    ]);
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Image not found'
    ]);
}
?>
