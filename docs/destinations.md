# Destinations

Destinations represent output renderers. In Direct Convert, destinations are output devices, often combined with optional format conversion settings.

## Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/destinations` | List destinations. |
| `GET` | `/destinations/{index}` | Get destination. |
| `POST` | `/destinations` | Create destination. |
| `PUT` | `/destinations/{index}` | Update destination. |
| `DELETE` | `/destinations/{index}` | Delete destination. |

## List Destinations

```http
GET /api/destinations
Authorization: Bearer perm:<token>
```

Response:

```json
[
  {
    "Index": 0,
    "Name": "Program Output",
    "Device": {
      "Type": "eMFDT_Video",
      "Index": 0,
      "KeyingMode": 0,
      "Name": "NDI Output"
    },
    "ConversionConfig": {
      "IsEnabled": true,
      "VideoFormat": "FullHD",
      "Interlace": "Progressive",
      "FrameRate": "50 fps",
      "FCCType": "Default pixel format",
      "AudioSampleRate": "48000 Hz",
      "AudioChannel": "2 ch",
      "AudioBit": "16 bits"
    }
  }
]
```

Exact conversion strings can vary with application localization.

## Get Destination

```http
GET /api/destinations/0
Authorization: Bearer perm:<token>
```

Returns the same shape as a single item from `GET /destinations`.

## Create Destination

```http
POST /api/destinations
Authorization: Bearer perm:<token>
Content-Type: application/json

{
  "Name": "Program Output",
  "Device": {
    "Type": "eMFDT_Video",
    "Index": 0,
    "Name": "NDI Output"
  },
  "KeyingMode": "",
  "ConversionConfig": {
    "IsEnabled": true,
    "VideoFormat": "FullHD",
    "Interlace": "Progressive",
    "FrameRate": "50 fps",
    "AudioSampleRate": "48000 Hz",
    "AudioChannel": "2 ch",
    "AudioBit": "16 bits"
  }
}
```

Rules:

- `Name` must be unique.
- `Device` is required and is matched by `Name`.
- `ConversionConfig` is optional, but recommended when output format conversion is needed.
- Use `GET /api/app/conversion-lists` to discover valid conversion strings.

## Update Destination

```http
PUT /api/destinations/0
Authorization: Bearer perm:<token>
Content-Type: application/json

{
  "Name": "Program Output 1",
  "Device": {
    "Type": "eMFDT_Video",
    "Index": 1,
    "Name": "NDI Output 2"
  },
  "ConversionConfig": {
    "IsEnabled": false
  }
}
```

Rules:

- The destination must exist.
- A destination currently in use cannot be updated.
- Device objects are parsed separately from other destination properties.

## Delete Destination

```http
DELETE /api/destinations/0
Authorization: Bearer perm:<token>
```

Rules:

- The destination must exist.
- A destination assigned to an actively converting channel cannot be deleted.

