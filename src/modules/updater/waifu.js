// DreamTime.
// Copyright (C) DreamNet. All rights reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License 3.0 as published by
// the Free Software Foundation. See <https://www.gnu.org/licenses/gpl-3.0.html>
//
// Written by Ivan Bravo Bravo <ivan@dreamnet.tech>, 2019.

import { isNil } from 'lodash'
import compareVersions from 'compare-versions'
import { BaseUpdater } from './base'
import { requirements } from '../system'
import { dreamtrack } from '../services'

const { getVersion } = $provider.waifu
const { getWaifuPath } = $provider.paths
const { extractSeven } = $provider.fs
const { activeWindow } = $provider.util
const { app, Notification } = $provider.api

class WaifuUpdater extends BaseUpdater {
  /**
   * @type {string}
   */
  get name() {
    return 'waifu'
  }

  /**
   * @type {string}
   */
  get githubRepo() {
    return super.githubRepo || 'dreamnettech/waifu2x-chainer'
  }

  /**
   * @return {string}
   */
  async _getCurrentVersion() {
    if (!requirements.waifu.installed) {
      return 'v0.0.0'
    }

    const version = await getVersion()
    return version
  }

  /**
   *
   * @param {*} releases
   */
  _getLatestCompatible(releases) {
    const currentVersion = `v${process.env.npm_package_version}`

    const minimum = dreamtrack.get(['projects', 'dreamtime', 'releases', currentVersion, 'waifu', 'minimum'], 'v0.1.0')
    const maximum = dreamtrack.get(['projects', 'dreamtime', 'releases', currentVersion, 'waifu', 'maximum'])

    if (!minimum) {
      return null
    }

    for (const release of releases) {
      if (compareVersions.compare(release.tag_name, minimum, '<')) {
        continue
      }

      if (!isNil(maximum) && compareVersions.compare(release.tag_name, maximum, '>')) {
        continue
      }

      return release
    }

    return null
  }

  /**
   *
   */
  async setup(required = false) {
    this._currentVersion = await this._getCurrentVersion()

    await super.setup(required)
  }

  /**
   *
   * @param {string} filepath
   */
  async install(filepath) {
    await extractSeven(filepath, getWaifuPath())

    // restart!
    app.relaunch()
    app.quit()
  }

  /**
   *
   */
  sendNotification() {
    if (!requirements.waifu.installed) {
      return
    }

    const notification = new Notification(
      {
        title: `🎉 Waifu2X ${this.latestCompatibleVersion}`,
        body: 'A new version of Waifu2X is available.',
      },
    )

    notification.show()

    notification.on('click', () => {
      window.$redirect('/wizard/waifu')

      if (activeWindow()) {
        activeWindow().focus()
      }
    })
  }
}

export const waifu = new WaifuUpdater()
