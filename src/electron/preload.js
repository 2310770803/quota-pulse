'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('quotaPulse', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (patch) => ipcRenderer.invoke('settings:update', patch),
  clearSessionUsageArchive: () => ipcRenderer.invoke('sessionUsageArchive:clear'),
  lookupModelPricing: (modelId) => ipcRenderer.invoke('pricing:lookup', modelId),
  previewAppearance: (patch) => ipcRenderer.invoke('appearance:preview', patch),
  getStats: (options) => ipcRenderer.invoke('stats:get', options),
  getSessionDetail: (args) => ipcRenderer.invoke('session:getDetail', args),
  getStreamStatus: () => ipcRenderer.invoke('stream:status'),
  onStatsPush: (callback) => {
    const listener = (_event, payload) => { try { callback(payload); } catch (_) {} };
    ipcRenderer.on('stats:push', listener);
    return () => ipcRenderer.removeListener('stats:push', listener);
  },
  onSettingsPush: (callback) => {
    const listener = (_event, payload) => { try { callback(payload); } catch (_) {} };
    ipcRenderer.on('settings:push', listener);
    return () => ipcRenderer.removeListener('settings:push', listener);
  },
  onOpenSettings: (callback) => {
    const listener = () => { try { callback(); } catch (_) {} };
    ipcRenderer.on('settings:open', listener);
    return () => ipcRenderer.removeListener('settings:open', listener);
  },
  onOpenView: (callback) => {
    const listener = (_event, viewId) => { try { callback(viewId); } catch (_) {} };
    ipcRenderer.on('view:open', listener);
    return () => ipcRenderer.removeListener('view:open', listener);
  },
  onTokscalePush: (callback) => {
    const listener = (_event, payload) => { try { callback(payload); } catch (_) {} };
    ipcRenderer.on('tokscale:push', listener);
    return () => ipcRenderer.removeListener('tokscale:push', listener);
  },
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  copyText: (text) => ipcRenderer.invoke('clipboard:write', text),
  openExternal: (url) => ipcRenderer.invoke('app:openExternal', url),
  openUserData: () => ipcRenderer.invoke('app:openUserData'),
  getTokscaleStatus: () => ipcRenderer.invoke('tokscale:getStatus'),
  checkTokscaleNpm: () => ipcRenderer.invoke('tokscale:checkNpm'),
  downloadTokscaleFromNpm: () => ipcRenderer.invoke('tokscale:downloadFromNpm'),
  resetTokscaleToBundled: () => ipcRenderer.invoke('tokscale:resetToBundled'),
  getAppUpdateState: () => ipcRenderer.invoke('appUpdate:getState'),
  checkAppUpdateNow: () => ipcRenderer.invoke('appUpdate:checkNow'),
  downloadAppUpdate: () => ipcRenderer.invoke('appUpdate:download'),
  installAppUpdate: () => ipcRenderer.invoke('appUpdate:install'),
  dismissAppUpdate: (version) => ipcRenderer.invoke('appUpdate:dismiss', version),
  expandFloatingBubble: () => ipcRenderer.invoke('floatingBubble:expand'),
  moveFloatingBubble: (delta) => ipcRenderer.invoke('floatingBubble:move', delta),
  signalContentReady: () => ipcRenderer.send('window:contentReady'),
  setViewState: (patch) => ipcRenderer.send('window:viewState', patch),
  peekFloatingBubble: () => ipcRenderer.invoke('floatingBubble:peek'),
  collapseFloatingBubbleIfIdle: () => ipcRenderer.invoke('floatingBubble:collapseIfIdle'),
  setFloatingBubbleCollapsedSize: (size) => ipcRenderer.invoke('floatingBubble:setCollapsedSize', size),
  onFloatingBubbleState: (callback) => {
    const listener = (_event, payload) => { try { callback(payload); } catch (_) {} };
    ipcRenderer.on('floatingBubble:state', listener);
    return () => ipcRenderer.removeListener('floatingBubble:state', listener);
  },
  onAppUpdatePush: (callback) => {
    const listener = (_event, payload) => { try { callback(payload); } catch (_) {} };
    ipcRenderer.on('appUpdate:push', listener);
    return () => ipcRenderer.removeListener('appUpdate:push', listener);
  },
  setTrayIcons: (icons) => ipcRenderer.invoke('tray:setIcons', icons),
  cursor: {
    loginManual: (token) => ipcRenderer.invoke('cursor:loginManual', token),
    logout: () => ipcRenderer.invoke('cursor:logout'),
    status: () => ipcRenderer.invoke('cursor:status')
  },
  opencode: {
    saveCookie: (cookie) => ipcRenderer.invoke('opencode:saveCookie', cookie),
    logout: () => ipcRenderer.invoke('opencode:logout'),
    status: () => ipcRenderer.invoke('opencode:status'),
    getProfiles: () => ipcRenderer.invoke('opencode:getProfiles'),
    saveProfile: (name, cookie) => ipcRenderer.invoke('opencode:saveProfile', name, cookie),
    deleteProfile: (name) => ipcRenderer.invoke('opencode:deleteProfile', name),
    renameProfile: (oldName, newName) => ipcRenderer.invoke('opencode:renameProfile', oldName, newName),
    setProfileEnabled: (name, enabled) => ipcRenderer.invoke('opencode:setProfileEnabled', name, enabled),
    refresh: () => ipcRenderer.invoke('opencode:refresh')
  },
  codex: {
    accounts: () => ipcRenderer.invoke('codex:accounts'),
    addAccount: (options = {}) => ipcRenderer.invoke('codex:addAccount', options),
    selectWorkspace: (options = {}) => ipcRenderer.invoke('codex:selectWorkspace', options),
    cancelLogin: (options = {}) => ipcRenderer.invoke('codex:cancelLogin', options),
    removeAccount: (id) => ipcRenderer.invoke('codex:removeAccount', id),
    setAccountEnabled: (id, enabled) => ipcRenderer.invoke('codex:setAccountEnabled', id, enabled),
    switchSystemAccount: (id) => ipcRenderer.invoke('codex:switchSystemAccount', id),
    refreshAccountLimits: (id) => ipcRenderer.invoke('codex:refreshAccountLimits', id),
    onLoginStatus: (callback) => {
      const handler = (_event, status) => callback(status);
      ipcRenderer.on('codex:loginStatus', handler);
      return () => ipcRenderer.removeListener('codex:loginStatus', handler);
    }
  },
  push: {
    test: (channel) => ipcRenderer.invoke('push:test', channel),
    sendNow: () => ipcRenderer.invoke('push:sendNow'),
    onResult: (callback) => {
      const handler = (_event, result) => { try { callback(result); } catch (_) {} };
      ipcRenderer.on('push:result', handler);
      return () => ipcRenderer.removeListener('push:result', handler);
    }
  },
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  quit: () => ipcRenderer.send('app:quit')
});
