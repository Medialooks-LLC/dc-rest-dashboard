# Direct Convert REST API

This documentation describes the REST API exposed by Medialooks Direct Convert.

The API lets an external application manage sources, output destinations, channel assignments, conversion start/stop commands, previews, resource metrics, project files, and application settings.

## Base URL

Direct Convert listens on the REST prefix configured in the application settings.

Default prefix:

```text
http://+:9753/
```

For local clients, use:

```text
http://127.0.0.1:9753/api
```

All endpoints in this documentation are relative to `/api`.

## Authentication

Every request must include an `Authorization` header.

When the Direct Convert license provides an API token, the header value must exactly match the token value exposed by the application, usually:

```http
Authorization: Bearer perm:<token>
```

If no API token is configured by the application, the REST listener still requires the header to be present.

## Content Type

Use JSON for request bodies:

```http
Content-Type: application/json
Accept: application/json
```

Most successful mutation endpoints return `200 OK` with an empty response body.

## Common Status Codes

| Status | Meaning |
| --- | --- |
| `200 OK` | Request succeeded. |
| `400 Bad Request` | Route, command, or JSON body is invalid. |
| `401 Unauthorized` | Missing or invalid `Authorization` header. |
| `404 Not Found` | Requested source, destination, channel, or assigned item does not exist. |
| `409 Conflict` | Resource is in use, command cannot run now, duplicate name, or Direct Convert has a modal dialog open. |
| `423 Locked` | Destination is already assigned to the channel. |
| `500 Internal Server Error` | Unexpected application error. |

## Modal Dialog Conflicts

Most mutating commands fail with `409 Conflict` when Direct Convert has a message box open.

When this happens:

1. Call `GET /api/app/dialog`.
2. Display or inspect the returned dialog state.
3. Call `PUT /api/app/dialog/ok` or `PUT /api/app/dialog/cancel`.
4. Retry the original command.

## Endpoint Groups

- [Application](application.md)
- [Devices](devices.md)
- [Sources](sources.md)
- [Destinations](destinations.md)
- [Channels](channels.md)
- [Schemas](schemas.md)

