<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');


// Get raw JSON input
$json = file_get_contents('php://input');
$data = json_decode($json);

// Validate CAPTCHA token
if (!isset($data->captcha) || empty($data->captcha)) {
    echo json_encode(["error" => "CAPTCHA verification failed. Please try again."]);
    exit;
}

// Verify CAPTCHA with Google
$secretKey = "***REMOVED***";
$captcha = $data->captcha;

$verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
$response = file_get_contents($verifyUrl . "?secret=" . urlencode($secretKey) . "&response=" . urlencode($captcha));
$responseKeys = json_decode($response, true);

if (!isset($responseKeys["success"]) || !$responseKeys["success"]) {
    echo json_encode(["error" => "CAPTCHA verification failed. Please try again."]);
    exit;
}

// Validate required fields
$requiredFields = ['uuid', 'encryptedUsername', 'salt', 'iv', 'hashedUsername', 'hashedPassword'];
foreach ($requiredFields as $field) {
    if (!property_exists($data, $field)) {
        echo json_encode(["error" => "Missing field: $field"]);
        exit;
    }
}

// Database connection
$host = "localhost";
$port = "5432";
$dbname = "postgres";
$user = "postgres";
$password = "password";

$conn = pg_connect("host=$host port=$port dbname=$dbname user=$user password=$password");

if (!$conn) {
    echo json_encode(["error" => "Failed to connect to database!"]);

    exit;
}

// Extract data
$uuid = $data->uuid;
$encryptedUsername = $data->encryptedUsername;
$salt = $data->salt;
$iv = $data->iv;
$hashedUsername = $data->hashedUsername;
$hashedPassword = $data->hashedPassword;

// Insert into database
$query = "INSERT INTO master (id, encrypted_username, username_salt, username_iv, hashed_username, hashed_password) 
          VALUES ($1, $2, $3, $4, $5, $6)";

$result = pg_query_params($conn, $query, [
    $uuid,
    $encryptedUsername,
    $salt,
    $iv,
    $hashedUsername,
    $hashedPassword
]);

if (!$result) {
    echo json_encode(["error" => "Registration Unsuccessful"]);

} else {
    echo json_encode(["success" => "Registration Successful"]);
   
}

// Close database connection
pg_close($conn);
?>
