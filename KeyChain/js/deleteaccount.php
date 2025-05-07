<?php
// Deletes a sub-account from db
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

$host = "localhost";
$port = "5432";
$dbname = "postgres";
$user = "postgres";
$password = "password";


    // Create connection
    $conn = pg_connect("host=$host port=$port dbname=$dbname user=$user password=$password");

    if(!$conn){
        echo json_encode(["Error" => "Failed to connect to database!"]);
        exit;
    }

    // Get JSON input
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['hashed_username'])) {
        echo json_encode(["error" => "Missing hashed username"]);
        exit;
    }
    
    // Get the hashed username from JSON file - this is used to find the row in db
    $hashed_username = $data['hashed_username'];

    // Prepare and execute delete query
    $sql = "DELETE FROM subaccount WHERE hashed_username = $1";
    $result = pg_query_params($conn, $sql, [$hashed_username]);

    if (!$result) {
        echo json_encode(["error" => "Delete Failed"]);
        exit;
    }

    echo json_encode(["success" => true]);

    pg_close($conn);

?>
