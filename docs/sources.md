# Sources

Sources represent video/audio inputs such as SDI, live devices, network streams, web capture, or other supported Direct Convert input types.

## Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/sources` | List sources. |
| `GET` | `/sources/{index}` | Get full source configuration. |
| `POST` | `/sources` | Create source. |
| `PUT` | `/sources/{index}` | Update source. |
| `DELETE` | `/sources/{index}` | Delete source. |

## List Sources

```http
GET /api/sources
Authorization: Bearer perm:<token>
```

Response:

```json
[
  {
    "Index": 0,
    "Name": "Camera 1",
    "Device": "DeckLink SDI 1"
  }
]
```

## Get Source

```http
GET /api/sources/0
Authorization: Bearer perm:<token>
```

Returns the full serialized source model. Important fields include:

| Field | Type | Description |
| --- | --- | --- |
| `Name` | string | Unique source name. |
| `VideoDevice` | Device | Selected video device. |
| `AudioDevice` | Device or null | Selected audio device. |
| `VideoLine` | string | Selected input line or source-specific line value. |
| `VideoFormat` | string | Selected video format where supported. |
| `StreamURL` | string | Network stream URL where supported. |
| `PageURL` | string | Web capture URL where supported. |
| `NoSignalImagePath` | string | Optional fallback image path. |
| `AudioShift` | number | Audio delay/shift value. |

## Create Source

```http
POST /api/sources
Authorization: Bearer perm:<token>
Content-Type: application/json

{
  "Name": "Camera 1",
  "VideoDevice": {
    "Type": "eMFDT_Video",
    "Index": 0,
    "Name": "DeckLink SDI 1"
  },
  "AudioDevice": {
    "Type": "eMFDT_Audio",
    "Index": 0,
    "Name": "DeckLink Audio"
  },
  "VideoLine": "SDI",
  "VideoFormat": "HD 1080i5994",
  "AudioShift": 0
}
```

Rules:

- `Name` is required and must be unique.
- `VideoDevice` is required.
- `AudioDevice` is optional.
- Device matching is done by `Type` and `Name`.
- If a Direct Convert modal dialog is open, the request returns `409 Conflict`.

## Update Source

```http
PUT /api/sources/0
Authorization: Bearer perm:<token>
Content-Type: application/json

{
  "Name": "Camera 1 Renamed",
  "VideoDevice": {
    "Type": "eMFDT_Video",
    "Index": 1,
    "Name": "DeckLink SDI 2"
  },
  "AudioDevice": null,
  "AudioShift": 0.25
}
```

Rules:

- The source must exist.
- A source currently in use cannot be updated.
- Device objects are parsed separately from other source properties.

## Delete Source

```http
DELETE /api/sources/0
Authorization: Bearer perm:<token>
```

Rules:

- The source must exist.
- A source currently in use or actively converting cannot be deleted.

