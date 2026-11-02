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

/// <reference types="../../../../electron/preload.d.ts" />

import {Localizer} from '@outline/infrastructure/i18n';
import {css, html, LitElement, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

@customElement('startup-settings')
export class StartupSettings extends LitElement {
  @property({type: Object}) localize: Localizer = message => message;
  @state() private enabled = false;
  @state() private busy = true;
  @state() private failed = false;
  @state() private loaded = false;

  private readonly supported = window.electron?.os.platform === 'win32';

  static styles = css`
    :host {
      display: block;
      font-family: var(--outline-font-family);
      color: var(--outline-text-color);
    }
    .setting {
      border-top: 1px solid var(--outline-hairline);
      padding: 16px;
      max-width: 248px;
    }
    label {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
    }
    input {
      margin: 3px 0 0;
      accent-color: var(--outline-primary);
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }
    p {
      font-size: 12px;
      line-height: 1.5;
      margin: 8px 0 0;
    }
  `;

  protected firstUpdated(): void {
    if (this.supported) {
      void this.load();
    }
  }

  private text(key: string, fallback: string): string {
    const translated = this.localize(key);
    return translated && translated !== key ? translated : fallback;
  }

  private async load(): Promise<void> {
    try {
      this.enabled = await window.electron.methodChannel.invoke(
        'get-launch-at-login'
      );
      this.loaded = true;
      this.failed = false;
    } catch (error) {
      this.failed = true;
      console.error('Could not load startup preference:', error);
    } finally {
      this.busy = false;
    }
  }

  private async change(event: Event): Promise<void> {
    const checkbox = event.currentTarget as HTMLInputElement;
    const requested = checkbox.checked;
    this.busy = true;
    this.failed = false;
    try {
      this.enabled = await window.electron.methodChannel.invoke(
        'set-launch-at-login',
        requested
      );
    } catch (error) {
      this.failed = true;
      console.error('Could not save startup preference:', error);
    } finally {
      checkbox.checked = this.enabled;
      this.busy = false;
    }
  }

  render() {
    if (!this.supported) {
      return nothing;
    }
    return html`
      <div class="setting">
        <label>
          <input
            type="checkbox"
            .checked=${this.enabled}
            ?disabled=${this.busy || !this.loaded}
            @change=${this.change}
          />
          <span>
            ${this.text(
              'launch-at-login',
              'Start Outline when signing in to Windows'
            )}
          </span>
        </label>
        <p>
          ${this.text(
            'launch-at-login-description',
            'When disabled, Outline will not start or restore a VPN connection automatically.'
          )}
        </p>
        ${this.failed
          ? html`<p role="alert">
              ${this.text(
                'launch-at-login-error',
                'Could not read or save this setting. Reopen Outline and try again.'
              )}
            </p>`
          : nothing}
      </div>
    `;
  }
}
