# Outline VPN — Windows Autostart Fix

**This fork addresses a long-standing Windows autostart problem that upstream has left unresolved for years.** It adds the missing checkbox so you can stop Outline from adding itself back to Windows startup every time you connect to a VPN.

This problem was observed on **Windows**. I have not investigated or verified the behavior on other operating systems. This change targets the Windows client only.


## Download Windows installers

These are unofficial, unsigned, experimental builds. Application installation and VPN connectivity have not been tested.

| Base version | Installer | Release notes and checksums |
| --- | --- | --- |
| 1.19.0 | [Download Windows EXE](https://github.com/Ragna13377/outline-apps/releases/download/v1.19.0-autostart.1/Outline-Client-1.19.0-autostart.1-windows-ia32.exe) | [1.19 release](https://github.com/Ragna13377/outline-apps/releases/tag/v1.19.0-autostart.1) |
| 1.21.0 | [Download Windows EXE](https://github.com/Ragna13377/outline-apps/releases/download/v1.21.0-autostart.1/Outline-Client-1.21.0-autostart.1-windows-ia32.exe) | [1.21 release](https://github.com/Ragna13377/outline-apps/releases/tag/v1.21.0-autostart.1) |

Both installers are Windows x86 / ia32 builds with the startup checkbox. Each release identifies its upstream release-candidate source tag and exact patched source commit. These are fork builds, not official stable Outline releases. The source lives in [release/windows-1.19](https://github.com/Ragna13377/outline-apps/tree/release/windows-1.19) and [release/windows-1.21](https://github.com/Ragna13377/outline-apps/tree/release/windows-1.21).

## Why this fork exists

Disabling Outline in Windows startup settings should be enough. Instead, the upstream client registers itself for startup again after a successful VPN connection. If Windows shuts down while Outline is connected, the client can launch at the next login and try to restore the VPN before the internet connection is ready.

This can leave users without a working internet connection after boot. Rather than having to remember to disconnect before every shutdown, users should be able to turn automatic startup off inside the app.

This is not a new request. Here are the upstream reports and responses:

- **[#686 — Feature Request: Proxy and Startup Settings](https://github.com/OutlineFoundation/outline-apps/issues/686)**: startup settings were requested in October 2019. The issue remains open.
- **[#1478 — Outline Client app adds itself to Windows 10 Autorun every time it connects to a server](https://github.com/OutlineFoundation/outline-apps/issues/1478)**: a November 2022 report describing the repeated Windows registry entry. A maintainer [called it a designed feature](https://github.com/OutlineFoundation/outline-apps/issues/1478#issuecomment-1334062674). The issue was later [closed as already logged as a feature request](https://github.com/OutlineFoundation/outline-apps/issues/1478#issuecomment-1438959612), not because a fix had shipped.
- **[#2559 — Add an option to disable auto-start on login](https://github.com/OutlineFoundation/outline-apps/issues/2559)**: a July 2025 Windows report describing network connectivity failures after reboot and requesting an in-app toggle. The issue remains open. The [maintainer's suggested workaround](https://github.com/OutlineFoundation/outline-apps/issues/2559#issuecomment-3114687261) was to disconnect before shutdown. A later [report for Outline 1.19.0](https://github.com/OutlineFoundation/outline-apps/issues/2559#issuecomment-4470738616) describes the startup entry being recreated even after removal through Windows settings, Autoruns, or the registry.

Issue states above were checked on **November 2, 2026**. These links document the repeated reports, upstream's treatment of the behavior, and the unresolved request for a toggle.

## Where is the checkbox?

Open Outline's **side menu** using the menu button in the main window. The checkbox is below the main navigation items, above the privacy and terms links:

> **Start Outline when signing in to Windows**

In Russian, it is labelled **«Запускать Outline при входе в Windows»**.

**Uncheck it to disable autostart.** Your choice is saved between application launches. Autostart is **off by default** in this fork.

When unchecked:

- Outline removes its own Electron-managed Windows startup entry.
- Connecting to a VPN does **not** register the app for startup again.
- Opening Outline does not automatically restore the saved VPN connection.
- An old startup command containing `--autostart` exits without starting the VPN.

When checked, Outline registers for Windows login startup and can restore a connection that was active at shutdown. Disconnecting the VPN does not reset the checkbox.

The network engine, VPN protocol, TAP drivers, and OutlineService are not modified. The service's startup configuration is separate from this client setting.

## Status

The checkbox and startup preference handling have been added to the source code. **The downloadable installers were compiled on GitHub Actions; no application installation, VPN connection tests, or Windows runtime verification were performed.** This is not a claim that every cause of lost connectivity after boot has been fixed.

The installers linked above are built from the corresponding patched release branches. Previously repacked binaries do not contain this checkbox. Editing these sources does not modify an already installed copy of Outline.

This is a one-off fix. No ongoing maintenance or future version updates are planned. Use at your own risk, without warranty. Automatic update checks are disabled in the downloadable one-off releases so upstream updates cannot silently remove the checkbox. The default development branch still contains the upstream update mechanism.

Unofficial fork of [OutlineFoundation/outline-apps](https://github.com/OutlineFoundation/outline-apps), distributed under the upstream [Apache License 2.0](LICENSE). Not affiliated with or endorsed by Outline Foundation.
