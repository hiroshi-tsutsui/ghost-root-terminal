-- Construct GCS URL for Dashcam Videos
-- Pattern assumption: gs://media.dotsfty.com/company/{company_id}/dashcam-videos/{driver_id}/{file_name}

SELECT 
  dv.id,
  dv.driver_id,
  c.id AS company_id,
  dv.file_name,
  CONCAT(
    'gs://media.dotsfty.com/company/',
    c.id,
    '/dashcam-videos/',
    dv.driver_id,
    '/',
    dv.file_name
  ) AS gs_url
FROM dashcam_videos dv
JOIN drivers d ON dv.driver_id = d.id
JOIN companies c ON d.company_id = c.id
WHERE 
  -- Example filter
  dv.file_name = 'video_b9133c46-cc64-419f-bc8f-f5b578148936_outward_002.mp4'
  OR dv.driver_id = 3754811; -- Just in case the ID in URL is driver_id
