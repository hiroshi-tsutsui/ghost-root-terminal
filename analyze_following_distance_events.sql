-- Analyze Detected Events by ELD Log Event Name
-- Join analyze_result_logs (Model 27, Detected) with dashcam_videos and extract eventName from eld_log_partial JSON array

SELECT 
    -- Extract eventName from the first element of the JSON array
    dv.eld_log_partial->0->>'eventName' AS event_name,
    COUNT(*) AS detection_count
FROM analyze_result_logs arl
JOIN dashcam_videos dv ON arl.dashcam_video_id = dv.id
WHERE 
    arl.ai_model_analyzer_id = 27
    AND arl.created_at >= NOW() - INTERVAL '7 days'
    -- Check for positive detection
    AND (arl.review_result_response->'result'->>'followingDistance')::boolean = true
GROUP BY event_name
ORDER BY detection_count DESC;
