# Security policy

## Supported versions

Only the latest code on `main` is supported. This project does not publish versioned releases.

| Version | Supported |
|---|---|
| `main` | Yes |
| Older commits | No |

## Reporting a vulnerability

Do not report a security problem in a public issue, discussion, or pull request.

Open a private report at <https://github.com/EranTzabar/TaskManagments/security/advisories/new>.

That page works after private vulnerability reporting is enabled for this repository. If the link does not open a form, the setting is still off or the repository is private.

Include:

- what the problem is and what an attacker can do with it
- steps to reproduce
- the commit on `main` you tested, or the date you cloned

The maintainer aims to acknowledge the report within 7 days, fix it on `main`, and credit you in the advisory if you want to be named.

## Running safely

- Set `JWT_SECRET` to a random string of at least 32 characters. Never commit `.env.local` or a real connection string.
- Do not expose MongoDB to the internet without authentication. Put the username and password in `MONGODB_URI`, not in the repository.
- Serve a production deployment over HTTPS. The auth cookie is marked secure when `NODE_ENV` is `production`.
- There is no public sign-up. The first admin is created with `npm run create-user`. Passwords are stored as scrypt hashes. Do not log them or put them in issues.
