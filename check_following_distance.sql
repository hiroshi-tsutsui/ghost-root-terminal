-- 1. Verify Model ID 27
SELECT * FROM ai_model_analyzers WHERE id = 27;

-- 2. Count detected events (result.followingDistance = true) for Model 27 in the last 7 days
SELECT COUNT(*)
FROM analyze_result_logs
WHERE ai_model_analyzer_id = 27
  AND created_at >= NOW() - INTERVAL '7 days'
  AND (review_result_response->'result'->>'followingDistance')::boolean = true;
