# Channels

Channels connect one source to zero or more destinations and control live conversion.

## Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/channels` | List channels. |
| `GET` | `/channels/{index}` | Get channel state. |
| `PUT` | `/channels/count/{count}` | Set preview grid size. |
| `GET` | `/channels/{index}/preview` | Get channel preview image as base64 PNG. |
| `PUT` | `/channels/{index}/set-source/{name}` | Assign source by name. |
| `PUT` | `/channels/{index}/unset-source` | Remove assigned source. |
| `PUT` | `/channels/{index}/add-dest/{name}` | Assign destination by name. |
| `PUT` | `/channels/{index}/delete-dest/{name}` | Remove destination by name. |
| `PUT` | `/channels/{index}/rec-start` | Start conversion. |
| `PUT` | `/channels/{index}/rec-stop` | Stop conversion. |

Names in path parameters must be URL encoded.

## List Channels

```http
GET /api/channels
Authorization: Bearer perm:<token>
```

Response:

```json
[
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
]
```

## Get Channel

```http
GET /api/channels/0
Authorization: Bearer perm:<token>
```

Returns one channel object.

## Set Channel Count

```http
PUT /api/channels/count/4
Authorization: Bearer perm:<token>
Content-Type: application/json

{}
```

The count must be between `1` and `16`.

Direct Convert stores this as preview grid size by taking the square root ceiling of the requested count.

## Get Preview

```http
GET /api/channels/0/preview
Authorization: Bearer perm:<token>
```

Returns a base64 encoded PNG frame.

Client-side display example:

```js
const response = await fetch("http://127.0.0.1:9753/api/channels/0/preview", {
  headers: { Authorization: "Bearer perm:<token>" }
});
const base64 = await response.text();
const imageUrl = `data:image/png;base64,${base64.replace(/^"|"$/g, "")}`;
```

## Assign Source

```http
PUT /api/channels/0/set-source/Camera%201
Authorization: Bearer perm:<token>
Content-Type: application/json

{}
```

Rules:

- Channel must exist.
- Source name must exist.
- Channel must not be converting.

## Unset Source

```http
PUT /api/channels/0/unset-source
Authorization: Bearer perm:<token>
Content-Type: application/json

{}
```

Rules:

- Channel must exist.
- Channel must not be converting.
- Channel must currently have a source.

## Assign Destination

```http
PUT /api/channels/0/add-dest/Program%20Output
Authorization: Bearer perm:<token>
Content-Type: application/json

{}
```

Rules:

- Channel must exist.
- Destination name must exist.
- Channel must not be converting.
- Returns `423 Locked` if the destination is already assigned.

## Remove Destination

```http
PUT /api/channels/0/delete-dest/Program%20Output
Authorization: Bearer perm:<token>
Content-Type: application/json

{}
```

Rules:

- Channel must exist.
- Destination must be assigned to the channel.
- Channel must not be converting.

## Start Conversion

```http
PUT /api/channels/0/rec-start
Authorization: Bearer perm:<token>
Content-Type: application/json

{}
```

Starts conversion for the selected channel if the application command can execute.

## Stop Conversion

```http
PUT /api/channels/0/rec-stop
Authorization: Bearer perm:<token>
Content-Type: application/json

{}
```

Stops conversion for the selected channel if the application command can execute.

## Typical Channel Workflow

1. `GET /devices/video`, `GET /devices/audio`, and `GET /devices/output`.
2. Create one or more sources with `POST /sources`.
3. Create one or more destinations with `POST /destinations`.
4. Assign a source with `PUT /channels/{index}/set-source/{name}`.
5. Assign outputs with `PUT /channels/{index}/add-dest/{name}`.
6. Start conversion with `PUT /channels/{index}/rec-start`.
7. Poll `GET /channels/{index}` for stats.
8. Stop conversion with `PUT /channels/{index}/rec-stop`.

