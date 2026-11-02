// Copyright 2026 The Outline Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {mkdirSync, readFileSync, renameSync, writeFileSync} from 'fs';
import {join} from 'path';

/** Windows login startup is opt-in and independent of connecting to a VPN. */
export class LaunchAtLoginSettings {
  private readonly filename: string;
  private launchAtLogin = false;

  constructor(private readonly directory: string) {
    this.filename = join(directory, 'launch_at_login.json');
    try {
      const saved = JSON.parse(readFileSync(this.filename, 'utf8'));
      this.launchAtLogin = saved?.enabled === true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Could not read launch-at-login preference:', error);
      }
      // A missing or damaged preference must not silently enable startup.
    }
  }

  get enabled(): boolean {
    return this.launchAtLogin;
  }

  setEnabled(enabled: boolean): void {
    mkdirSync(this.directory, {recursive: true});
    const temporaryFile = `${this.filename}.tmp`;
    writeFileSync(temporaryFile, JSON.stringify({enabled}), 'utf8');
    renameSync(temporaryFile, this.filename);
    this.launchAtLogin = enabled;
  }
}
