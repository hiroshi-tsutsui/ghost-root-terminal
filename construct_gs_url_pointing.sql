-- Construct GCS URL for Dashcam Videos (Pointing) - URL Only
SELECT DISTINCT ON (de.id)
  CONCAT(
    'gs://media.dotsfty.com/company/',
    d.company_id,
    '/dashcam-videos/',
    dv.id,
    '/',
    dv.file_name
  ) AS gs_url
FROM dashcam_events de
JOIN dashcam_videos dv ON dv.id = (de.dashcam_event_detail->>'videoId')::int
JOIN drivers d ON dv.driver_id = d.id
WHERE 
  d.company_id = 46 
  AND de.created_at >= '2025-10-01 00:00:00' 
  AND de.created_at <= '2025-12-31 23:59:59'
  AND de.dashcam_event_detail::text LIKE '%pointing%'
  AND de.is_valid_detection = 'true'
ORDER BY de.id, de.created_at DESC;
