<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

$host = "localhost";
$port = "5432";
$dbname = "postgres";
$user = "postgres";
$password = "password";

$conn = pg_connect("host=$host port=$port dbname=$dbname user=$user password=$password");

if(!$conn){
    echo json_encode(["Error" => "Failed to connect to database!"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if(!isset($data->uuid)){
    echo json_encode(["error" => "Missing uuid"]);
    exit;
}

$uuid = $data->uuid;

// Query stored usernames and asscociated domain names 
$sql= "SELECT encrypted_username, username_iv, username_salt, hashed_username, encrypted_password, 
            password_iv, password_salt,encrypted_domain, domain_iv, domain_salt, hashed_domain,
            encrypted_timestamp, timestamp_salt, timestamp_iv 
            FROM subaccount WHERE master_id = $1"; 
$result = pg_query_params($conn, $sql, [$uuid]);

if (!$result) {
    echo json_encode(["error" => "Query failed"]);
    exit;
}

// Create an array of accounts
$rows = [];

while ($row = pg_fetch_assoc($result)) {
    $rows[] = [
        "encrypted_username" => $row['encrypted_username'],
        "username_iv" => $row['username_iv'],
        "username_salt" => $row['username_salt'],
        "hashed_username" => $row['hashed_username'],
        "encrypted_password" => $row['encrypted_password'],
        "password_iv" => $row['password_iv'],
        "password_salt" => $row['password_salt'],
        "encrypted_domain" => $row['encrypted_domain'],
        "domain_iv" => $row['domain_iv'],
        "domain_salt" => $row['domain_salt'],
        "hashed_domain" => $row['hashed_domain'],
        "encrypted_timestamp" => $row['encrypted_timestamp'],
        "timestamp_salt" => $row['timestamp_salt'],
        "timestamp_iv" => $row['timestamp_iv']
    ];
}



        if (count($rows) === 0) {
            echo json_encode(["error" => "No accounts found"]);
        } else {
            echo json_encode([
                "success" => "Account retrieval successful",
                "accounts" => $rows
            ]);
        }
        
        pg_close($conn);


?>