# Activity: Build a Module
**Task: Design the development steps for 'Report Issue' (SAAF Citizen Portal)**

Based on the current citizen interface of the app (specifically the `ReportPage`), here are the development steps following the methodology from your presentation:

### Step 1: Identify inputs and validations
**Inputs:**
- **Photos:** Minimum 3 multi-angle photo uploads (Context, Materials, Detail views).
- **Issue Category:** Selection from predefined list (e.g., Overflowing Garbage Dump, C&D Debris, Choked Storm Drain).
- **Severity & Traffic Impact:** Selection from list (e.g., Urgent / Obstruction).
- **Ground Access Notes:** Text input for landmarks/access details.
- **Anonymity Preference:** Checkbox to remain anonymous on the public feed.
- **Location:** Geotagged coordinates (Latitude/Longitude) and Street Address.

**Validations:**
- **Photo Count:** The "Submit" action is disabled unless at least 3 photos are uploaded.
- **File Type:** Uploaded files must be of type `image/*`.
- **Note Length:** Ground Access Notes must not exceed 500 characters.

### Step 2: Define the function/API
**API Endpoint:** `POST /api/reports`

**Request Payload (FormData):**
- `photos`: Array of 3 or more File objects
- `category`: String (e.g., "Overflowing Garbage Dump")
- `severity`: String (e.g., "Urgent / Obstruction")
- `note`: String (max 500 chars)
- `isAnonymous`: Boolean
- `latitude`: Number
- `longitude`: Number
- `address`: String

**Response Options:**
- `201 Created`: `{ "success": true, "reportId": "MCD-8409", "slaETA": "95 mins" }`
- `400 Bad Request`: `{ "error": "Validation failed: Minimum 3 photos required." }`

### Step 3: Identify database updates
When a report is successfully submitted, the following database updates occur:
1. **Reports Table:** Insert a new record containing the `reportId`, citizen's user ID, chosen category, severity, text notes, location coordinates, ward assignment (e.g., Ward 84), and anonymity preference.
2. **Photos Storage:** Upload the images to a cloud storage bucket (e.g., AWS S3) and insert records into a `Photos` table linking the image URLs and angle types to the `reportId`.
3. **Dispatch/SLA Table:** Create a new entry triggering the 95-minute SLA timer for the municipal zone officer.

### Step 4: Write 3-5 unit-test cases
1. **Successful Submission:** Verify that submitting a complete form with exactly 3 images, a selected category/severity, and valid text notes returns a 201 status and a valid `reportId`.
2. **Missing Photos Validation:** Verify that attempting to submit with fewer than 3 photos returns a 400 Bad Request error and the UI submit button remains disabled.
3. **Invalid File Upload:** Verify that selecting a non-image file (like a `.pdf`) triggers the "Only image files can be added as issue evidence" error message on the frontend.
4. **Notes Character Limit:** Verify that entering 501 characters into the Ground Access Notes field is truncated or correctly rejected by the API validation.
5. **AI Tamper Verification Failure (Mocked):** Verify that if the mocked AI verification service flags an image as a duplicate or deepfake, the API rejects the submission and alerts the user.

### Step 5: Identify one possible integration issue
**Mapping & Geocoding Service Timeout:**
The app relies on reverse geocoding to translate raw GPS coordinates into a specific Ward (e.g., Ward 84) to route the issue to the correct municipal officer. If the external GIS/mapping integration is down or responds too slowly, the app might fail to assign a ward. This would break the routing logic, preventing the SLA timer from starting and stalling the dispatch pipeline.
