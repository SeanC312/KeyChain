<?php  
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

$data = json_decode(file_get_contents("php://input"));

if (
    !isset($data->uuid) || !isset($data->encrypted_username)
    || !isset($data->username_iv) || !isset($data->username_salt)
    || !isset($data->hashed_username) || !isset($data->encrypted_password)
    || !isset($data->password_iv) || !isset($data->password_salt)
    || !isset($data->encrypted_domain) || !isset($data->domain_iv)
    || !isset($data->domain_salt) || !isset($data->hashed_domain)
    || !isset($data->encrypted_timestamp)
    || !isset($data->timestamp_salt) || !isset($data->timestamp_iv)
) {
    echo json_encode(["error" => "Missing credentials"]);
    exit;
}

// Assign variables
$uuid = $data->uuid;

$encrypted_username = $data->encrypted_username;
$username_iv = $data->username_iv;
$username_salt = $data->username_salt;
$hashed_username = $data->hashed_username;

$encrypted_password = $data->encrypted_password;
$password_iv = $data->password_iv;
$password_salt = $data->password_salt;

$encrypted_domain = $data->encrypted_domain;
$domain_iv = $data->domain_iv;
$domain_salt = $data->domain_salt;
$hashed_domain = $data->hashed_domain;

$encrypted_timestamp = $data->encrypted_timestamp;
$timestamp_salt = $data->timestamp_salt;
$timestamp_iv = $data->timestamp_iv;

// Query
$query = "INSERT INTO subaccount (
    master_id, 
    encrypted_username, username_iv, username_salt, hashed_username, 
    encrypted_password, password_iv, password_salt,
    encrypted_domain, domain_iv, domain_salt, hashed_domain,
    encrypted_timestamp, timestamp_salt, timestamp_iv
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
);";

// Execute query
$result = pg_query_params($conn, $query, [
    $uuid,
    $encrypted_username,
    $username_iv,
    $username_salt,
    $hashed_username,
    $encrypted_password,
    $password_iv,
    $password_salt,
    $encrypted_domain,
    $domain_iv,
    $domain_salt,
    $hashed_domain,
    $encrypted_timestamp,
    $timestamp_salt,
    $timestamp_iv
]);

if (!$result) {
    echo json_encode(["error" => "Sub-Account Creation Unsuccessful"]);
    exit;
} else {
    echo json_encode(["success" => "Sub-Account Creation Successful"]);
    exit;
}

pg_close($conn);
?>
