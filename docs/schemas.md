# Schemas

This page documents common JSON object shapes used by the Direct Convert REST API.

Direct Convert serializes .NET model objects directly. Some objects can include additional fields depending on source type, selected device, application version, and localization.

## Device

Used by sources, destinations, and device list endpoints.

```json
{
  "Type": "eMFDT_Video",
  "Index": 0,
  "KeyingMode": 0,
  "Name": "DeckLink SDI 1"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `Type` | string | Medialooks device type enum value. |
| `Index` | number | Device index. |
| `KeyingMode` | number | Output keying mode index where applicable. |
| `Name` | string | Device display name. |

For creating or updating sources, devices are matched by `Type` and `Name`.

For creating destinations, output devices are matched by `Name`.

## Source Summary

Returned by `GET /sources`.

```json
{
  "Index": 0,
  "Name": "Camera 1",
  "Device": "DeckLink SDI 1"
}
```

## Source Payload

Common fields accepted by `POST /sources` and `PUT /sources/{index}`:

```json
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
  "StreamURL": "",
  "PageURL": "",
  "NoSignalImagePath": "",
  "AudioShift": 0
}
```

## Destination

Returned by `GET /destinations`.

```json
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
```

## Destination Payload

Accepted by `POST /destinations` and `PUT /destinations/{index}`:

```json
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

## ConversionConfig

```json
{
  "IsEnabled": true,
  "VideoFormat": "FullHD",
  "Interlace": "Progressive",
  "FrameRate": "50 fps",
  "FCCType": "Default pixel format",
  "AudioSampleRate": "48000 Hz",
  "AudioChannel": "2 ch",
  "AudioBit": "16 bits"
}
```

| Field | Description |
| --- | --- |
| `IsEnabled` | Enables conversion for the destination. |
| `VideoFormat` | Resolution preset. Use `/app/conversion-lists` for valid values. |
| `Interlace` | Field order. Use `/app/conversion-lists` for valid values. |
| `FrameRate` | Output frame rate. Use `/app/conversion-lists` for valid values. |
| `FCCType` | Pixel format string. Usually leave default unless required. |
| `AudioSampleRate` | Output audio sample rate. |
| `AudioChannel` | Output audio channel count. |
| `AudioBit` | Output audio bit depth. |

The REST API accepts localized string values used by the Direct Convert UI. For portable integrations, discover values at runtime with `GET /api/app/conversion-lists`.

## Channel

```json
{
  "Index": 0,
  "SourceName": "Camera 1",
  "Destinations": ["Program Output"],
  "IsConverting": true,
  "IsAudioPreview": false,
  "ConvertingDuration": "00:01:23",
  "ConvertingFPS": "50.00",
  "ConvertingBreaks": "0",
  "ConvertingDrops": "0",
  "ConvertingBuffered": "2"
}
```

| Field | Description |
| --- | --- |
| `Index` | Channel index. |
| `SourceName` | Assigned source name or `Not Specified`. |
| `Destinations` | Assigned destination names. |
| `IsConverting` | Whether channel conversion is active. |
| `IsAudioPreview` | Whether audio preview is active. |
| `ConvertingDuration` | Current conversion duration. |
| `ConvertingFPS` | Current conversion frame rate. |
| `ConvertingBreaks` | Break count. |
| `ConvertingDrops` | Dropped frame count. |
| `ConvertingBuffered` | Buffered frame count. |

## Project Path Payload

Used by `/app/save` and `/app/load`.

```json
{
  "Path": "D:\\Projects\\show-01.dcproj"
}
```

