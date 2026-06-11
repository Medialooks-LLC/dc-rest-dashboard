# Devices

Device endpoints return available input and output devices.

## Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/devices/video` | Return video input devices. |
| `GET` | `/devices/audio` | Return audio input devices. |
| `GET` | `/devices/output` | Return output renderer devices. |

## Get Video Devices

```http
GET /api/devices/video
Authorization: Bearer perm:<token>
```

Example response:

```json
[
  {
    "Type": "eMFDT_Video",
    "Index": 0,
    "KeyingMode": 0,
    "Name": "DeckLink SDI 1"
  }
]
```

## Get Audio Devices

```http
GET /api/devices/audio
Authorization: Bearer perm:<token>
```

Example response:

```json
[
  {
    "Type": "eMFDT_Audio",
    "Index": 0,
    "KeyingMode": 0,
    "Name": "DeckLink Audio"
  }
]
```

## Get Output Devices

```http
GET /api/devices/output
Authorization: Bearer perm:<token>
```

Example response:

```json
[
  {
    "Type": "eMFDT_Video",
    "Index": 0,
    "KeyingMode": 0,
    "Name": "NDI Output"
  }
]
```

Use returned `Device` objects in `Source.VideoDevice`, `Source.AudioDevice`, and `Destination.Device` payloads.

