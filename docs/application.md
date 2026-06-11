# Application

Application endpoints expose project operations, application state, settings, conversion option lists, resource metrics, and modal dialog handling.

## Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/app/state` | Return serialized application state. |
| `GET` | `/app/settings` | Return application settings. |
| `PUT` | `/app/settings` | Update application settings. |
| `PUT` | `/app/new` | Create a new project. |
| `PUT` | `/app/save` | Save current project to a path. |
| `PUT` | `/app/load` | Load project from a path. |
| `GET` | `/app/conversion-lists` | Return allowed conversion setting values. |
| `GET` | `/app/resources` | Return CPU and RAM usage. |
| `GET` | `/app/dialog` | Return current modal dialog state, if any. |
| `PUT` | `/app/dialog/{action}` | Act on the current dialog. `{action}` is usually `ok` or `cancel`. |

## Get Application State

```http
GET /api/app/state
Authorization: Bearer perm:<token>
```

Returns the serialized `MainViewModel`. Use focused endpoints such as `/channels`, `/sources`, and `/destinations` for most integrations.

## Get Settings

```http
GET /api/app/settings
Authorization: Bearer perm:<token>
```

Returns application settings. Some settings are not serialized because they are marked internal to the application model.

## Update Settings

```http
PUT /api/app/settings
Authorization: Bearer perm:<token>
Content-Type: application/json

{
  "IsEnableRest": true
}
```

The request body is populated into the Direct Convert `AppSettings` model.

## New Project

```http
PUT /api/app/new
Authorization: Bearer perm:<token>
Content-Type: application/json

{}
```

Creates a new project if the application command can execute.

## Save Project

```http
PUT /api/app/save
Authorization: Bearer perm:<token>
Content-Type: application/json

{
  "Path": "D:\\Projects\\show-01.dcproj"
}
```

Saves the current project to `Path`.

## Load Project

```http
PUT /api/app/load
Authorization: Bearer perm:<token>
Content-Type: application/json

{
  "Path": "D:\\Projects\\show-01.dcproj"
}
```

Loads a project from `Path`.

## Conversion Lists

```http
GET /api/app/conversion-lists
Authorization: Bearer perm:<token>
```

Returns a flat key/value array:

```json
[
  "VideoFormats",
  ["Original resolution", "PAL", "NTSC", "HD720", "FullHD", "UHD"],
  "FrameRates",
  ["Original frame rate", "23.98 fps", "24 fps", "25 fps", "29.97 fps", "30 fps", "50 fps", "59.94 fps", "60 fps"],
  "Interlaces",
  ["Original field order", "Progressive", "Top Field First", "Bottom Field First", "Inverse field order"],
  "AudioSampleRates",
  ["Original sample rate", "48000 Hz", "44100 Hz"],
  "AudioChannels",
  ["Original channels", "1 ch", "2 ch", "4 ch", "8 ch", "16 ch"],
  "AudioBits",
  ["Original bits", "16 bits", "32 bits"]
]
```

Exact localized strings can vary with application language.

## Resources

```http
GET /api/app/resources
Authorization: Bearer perm:<token>
```

Returns a flat key/value array:

```json
[
  "CurrentCPU",
  23.7,
  "TotalCPU",
  4.2,
  "CurrentRAM",
  6.4,
  "TotalRAM",
  31.9
]
```

## Dialog State

```http
GET /api/app/dialog
Authorization: Bearer perm:<token>
```

If a Direct Convert dialog is open, returns the dialog info object. If no dialog is open, returns:

```json
"No message box shown"
```

## Dialog Action

```http
PUT /api/app/dialog/ok
Authorization: Bearer perm:<token>
Content-Type: application/json

{}
```

Supported action strings are passed directly to the application dialog handler. Use `ok` or `cancel` for normal confirmation dialogs.

