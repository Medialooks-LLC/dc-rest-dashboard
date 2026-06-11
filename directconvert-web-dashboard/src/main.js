import { DirectConvertClient } from '@local/directconvert-js-client';
import { createIcons, ExternalLink, Link, MonitorUp, Pause, Play, Plus, RefreshCw, Save, Settings, Square, Unlink, Wifi, X } from 'lucide';
import './styles.css';

const state = {
  client: new DirectConvertClient({ baseUrl: getInitialBaseUrl(), token: localStorage.getItem('dc.token') || '' }),
  baseUrl: getInitialBaseUrl(),
  token: localStorage.getItem('dc.token') || '',
  previewUpdateSeconds: clampNumber(Number(localStorage.getItem('dc.previewUpdateSeconds') ?? 30), 0, 3600),
  resourceUpdateSeconds: clampNumber(Number(localStorage.getItem('dc.resourceUpdateSeconds') ?? 15), 0, 3600),
  channelStatsUpdateSeconds: clampNumber(Number(localStorage.getItem('dc.channelStatsUpdateSeconds') ?? 3), 0, 3600),
  channels: [],
  sources: [],
  destinations: [],
  videoDevices: [],
  audioDevices: [],
  outputDevices: [],
  conversionLists: {},
  resources: null,
  channelPreviews: new Map(),
  selectedChannel: null,
  selectedSource: null,
  selectedDestination: null,
  log: [],
  previewRefreshId: 0,
  previewTimerId: null,
  resourceTimerId: null,
  channelStatsTimerId: null
};

document.querySelector('#app').innerHTML = `
  <main class="shell">
    <section class="connection">
      <label>
        <span>REST API URL</span>
        <input id="baseUrl" value="${escapeHtml(state.baseUrl)}" placeholder="http://localhost:9753/api/" />
      </label>
      <label>
        <span>Authorization token</span>
        <input id="token" value="${escapeHtml(state.token)}" type="password" placeholder="API token" />
      </label>
      <button id="connect"><i data-lucide="wifi"></i><span>Connect</span></button>
      <button id="refresh"><i data-lucide="refresh-cw"></i><span>Refresh</span></button>
      <button id="settings" class="icon-button" title="Settings"><i data-lucide="settings"></i></button>
    </section>

    <section class="workspace">
      <aside class="inventory">
        <section class="panel">
          <div class="panel-header">
            <div class="panel-title">Sources</div>
            <button id="newSource" class="icon-button" title="Create source"><i data-lucide="plus"></i></button>
          </div>
          <div id="sources" class="list"></div>
        </section>
        <section class="panel">
          <div class="panel-header">
            <div class="panel-title">Outputs</div>
            <button id="newDestination" class="icon-button" title="Create output"><i data-lucide="plus"></i></button>
          </div>
          <div id="destinations" class="list"></div>
        </section>
      </aside>

      <section class="main-area">
        <section class="panel channels-panel">
          <div class="panel-header">
            <div class="panel-title">Channels</div>
            <div class="grid-buttons">
              <button data-grid="1">1</button>
              <button data-grid="4">4</button>
              <button data-grid="9">9</button>
              <button data-grid="16">16</button>
            </div>
          </div>
          <div id="channels" class="channels"></div>
        </section>

        <section class="actions">
          <button id="setSource"><i data-lucide="link"></i><span>Set Source</span></button>
          <button id="unsetSource"><i data-lucide="unlink"></i><span>Unset Source</span></button>
          <button id="addDest"><i data-lucide="monitor-up"></i><span>Assign Output</span></button>
          <button id="removeDest"><i data-lucide="unlink"></i><span>Remove Output</span></button>
          <button id="recStart" class="danger"><i data-lucide="play"></i><span>Convert</span></button>
          <button id="recStop"><i data-lucide="square"></i><span>Stop</span></button>
        </section>

        <section class="system-grid">
          <section class="panel">
            <div class="panel-title">Resources</div>
            <div id="resources" class="resources-view"></div>
          </section>
          <section class="panel">
            <div class="panel-title">Selected Channel</div>
            <div id="selection" class="selection-view"></div>
          </section>
        </section>
      </section>
    </section>

    <section class="log">
      <div class="panel-header">
        <div class="panel-title">Log</div>
        <div class="log-tools">
          <button id="saveLog" class="icon-button" title="Save log"><i data-lucide="save"></i></button>
          <button id="openLog" class="icon-button" title="Open log in new tab"><i data-lucide="external-link"></i></button>
        </div>
      </div>
      <pre id="log"></pre>
    </section>
    <div id="modalRoot"></div>
  </main>
`;

createIcons({ icons: { ExternalLink, Link, MonitorUp, Pause, Play, Plus, RefreshCw, Save, Settings, Square, Unlink, Wifi, X } });

const elements = {
  baseUrl: document.querySelector('#baseUrl'),
  token: document.querySelector('#token'),
  sources: document.querySelector('#sources'),
  destinations: document.querySelector('#destinations'),
  channels: document.querySelector('#channels'),
  resources: document.querySelector('#resources'),
  selection: document.querySelector('#selection'),
  log: document.querySelector('#log'),
  modalRoot: document.querySelector('#modalRoot')
};

document.querySelector('#connect').addEventListener('click', connect);
document.querySelector('#refresh').addEventListener('click', () => runAction('Refresh', refresh, { skipRefresh: true }));
document.querySelector('#settings').addEventListener('click', openSettingsDialog);
document.querySelector('#newSource').addEventListener('click', () => openSourceDialog());
document.querySelector('#newDestination').addEventListener('click', () => openDestinationDialog());
document.querySelector('#saveLog').addEventListener('click', saveLog);
document.querySelector('#openLog').addEventListener('click', openLogTab);
document.querySelector('#setSource').addEventListener('click', () => runSelectedAction('Set source', () => state.client.setChannelSource(requireChannel(), requireSource().Name)));
document.querySelector('#unsetSource').addEventListener('click', () => runSelectedAction('Unset source', () => state.client.unsetChannelSource(requireChannel())));
document.querySelector('#addDest').addEventListener('click', () => runSelectedAction('Assign output', () => state.client.addChannelDestination(requireChannel(), requireDestination().Name)));
document.querySelector('#removeDest').addEventListener('click', () => runSelectedAction('Remove output', () => state.client.deleteChannelDestination(requireChannel(), requireDestination().Name)));
document.querySelector('#recStart').addEventListener('click', () => runSelectedAction('Start conversion', () => state.client.startChannelConversion(requireChannel())));
document.querySelector('#recStop').addEventListener('click', () => runSelectedAction('Stop conversion', () => state.client.stopChannelConversion(requireChannel())));
document.querySelectorAll('[data-grid]').forEach((button) => {
  button.addEventListener('click', () => runAction(`Set grid ${button.dataset.grid}`, () => state.client.setChannelCount(Number(button.dataset.grid))));
});

document.addEventListener('dragenter', acceptDashboardDrag, true);
document.addEventListener('dragover', acceptDashboardDrag, true);
document.addEventListener('drop', clearDragState);
document.addEventListener('dragend', clearDragState);

render();

async function connect() {
  state.baseUrl = normalizeDashboardBaseUrl(elements.baseUrl.value.trim() || '/dc-api/');
  state.token = elements.token.value.trim();
  elements.baseUrl.value = state.baseUrl;
  localStorage.setItem('dc.baseUrl', state.baseUrl);
  localStorage.setItem('dc.token', state.token);
  state.client.setConnection({ baseUrl: state.baseUrl, token: state.token });
  await runAction('Connect', refresh, { skipRefresh: true });
}

async function refresh() {
  const [sources, destinations, channels, resources, videoDevices, audioDevices, outputDevices, conversionLists] = await Promise.all([
    state.client.getSources(),
    state.client.getDestinations(),
    state.client.getChannels(),
    state.client.getResources(),
    state.client.getVideoDevices(),
    state.client.getAudioDevices(),
    state.client.getOutputDevices(),
    state.client.getConversionLists()
  ]);

  state.sources = toList(sources);
  state.destinations = toList(destinations);
  state.channels = toList(channels);
  state.videoDevices = toList(videoDevices);
  state.audioDevices = toList(audioDevices);
  state.outputDevices = toList(outputDevices);
  state.conversionLists = normalizeKeyValueList(conversionLists);
  state.resources = resources;

  if (!state.channels.some((channel) => channel.Index === state.selectedChannel)) {
    state.selectedChannel = state.channels[0]?.Index ?? null;
  }

  render();
  refreshChannelPreviews({ force: true });
  schedulePreviewUpdates();
  scheduleResourceUpdates();
  scheduleChannelStatsUpdates();
}

async function runSelectedAction(label, action) {
  await runAction(label, action);
}

async function runAction(label, action, { skipRefresh = false } = {}) {
  try {
    await action();
    pushLog(`${label}: ok`);
    if (!skipRefresh) {
      await refresh();
    }
  } catch (error) {
    pushLog(`${label}: ${error.message}`);
    renderLog();
  }
}

function openSettingsDialog() {
  showDialog(`
    <form id="settingsForm" class="dialog">
      <div class="dialog-header">
        <div class="dialog-title">Settings</div>
        <button type="button" class="icon-button" data-close-dialog title="Close"><i data-lucide="x"></i></button>
      </div>
      ${renderNumberField('previewUpdateSeconds', 'Preview update interval, seconds', state.previewUpdateSeconds)}
      ${renderNumberField('resourceUpdateSeconds', 'Resources update interval, seconds', state.resourceUpdateSeconds)}
      ${renderNumberField('channelStatsUpdateSeconds', 'Channel stats update interval, seconds', state.channelStatsUpdateSeconds)}
      <div class="field-hint">Use 0 to disable an automatic refresh interval.</div>
      <div class="dialog-actions">
        <button type="button" data-close-dialog><i data-lucide="x"></i><span>Cancel</span></button>
        <button type="submit"><i data-lucide="save"></i><span>Save Settings</span></button>
      </div>
    </form>
  `);
  document.querySelector('#settingsForm').addEventListener('submit', submitSettingsForm);
}

function submitSettingsForm(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  state.previewUpdateSeconds = clampNumber(Number(form.get('previewUpdateSeconds')), 0, 3600);
  state.resourceUpdateSeconds = clampNumber(Number(form.get('resourceUpdateSeconds')), 0, 3600);
  state.channelStatsUpdateSeconds = clampNumber(Number(form.get('channelStatsUpdateSeconds')), 0, 3600);
  localStorage.setItem('dc.previewUpdateSeconds', String(state.previewUpdateSeconds));
  localStorage.setItem('dc.resourceUpdateSeconds', String(state.resourceUpdateSeconds));
  localStorage.setItem('dc.channelStatsUpdateSeconds', String(state.channelStatsUpdateSeconds));
  closeDialog();
  schedulePreviewUpdates();
  scheduleResourceUpdates();
  scheduleChannelStatsUpdates();
  pushLog(`Settings: preview ${formatInterval(state.previewUpdateSeconds)}, resources ${formatInterval(state.resourceUpdateSeconds)}, channel stats ${formatInterval(state.channelStatsUpdateSeconds)}`);
  renderLog();
}

async function openSourceEditor(summary) {
  await runAction('Load source', async () => {
    const source = await state.client.getSource(summary.Index);
    openSourceDialog({ index: summary.Index, source: source || summary });
  }, { skipRefresh: true });
}

function openSourceDialog({ index = null, source = {} } = {}) {
  const isEdit = index !== null;
  const videoOptions = state.videoDevices.map((device, optionIndex) => renderOption(optionIndex, device.Name, isSameDevice(device, source.VideoDevice))).join('');
  const audioOptions = state.audioDevices.map((device, optionIndex) => renderOption(optionIndex, device.Name, isSameDevice(device, source.AudioDevice))).join('');
  showDialog(`
    <form id="sourceForm" class="dialog" data-index="${isEdit ? index : ''}">
      <div class="dialog-header">
        <div class="dialog-title">${isEdit ? 'Edit Source' : 'Create Source'}</div>
        <button type="button" class="icon-button" data-close-dialog title="Close"><i data-lucide="x"></i></button>
      </div>
      ${renderTextField('name', 'Source name', source.Name || `Source ${state.sources.length + 1}`, true)}
      <label><span>Video device</span><select name="videoDevice" required ${state.videoDevices.length ? '' : 'disabled'}>${videoOptions || '<option>No video devices loaded</option>'}</select></label>
      <label><span>Audio device</span><select name="audioDevice" ${state.audioDevices.length ? '' : 'disabled'}><option value="">No audio</option>${audioOptions}</select></label>
      ${renderTextField('videoLine', 'Video line', source.VideoLine || '')}
      ${renderTextField('videoFormat', 'Video format', source.VideoFormat || '')}
      ${renderTextField('streamURL', 'Stream URL', source.StreamURL || '')}
      ${renderTextField('pageURL', 'Page URL', source.PageURL || '')}
      ${renderTextField('noSignalImagePath', 'No signal image path', source.NoSignalImagePath || '')}
      ${renderTextField('audioShift', 'Audio shift', source.AudioShift ?? 0)}
      <div class="dialog-actions">
        <button type="button" data-close-dialog><i data-lucide="x"></i><span>Cancel</span></button>
        <button type="submit"><i data-lucide="save"></i><span>${isEdit ? 'Save Source' : 'Create Source'}</span></button>
      </div>
    </form>
  `);
  document.querySelector('#sourceForm').addEventListener('submit', submitSourceForm);
}

async function submitSourceForm(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const index = event.currentTarget.dataset.index;
  const source = removeEmptyFields({
    Name: form.get('name'),
    VideoDevice: state.videoDevices[Number(form.get('videoDevice'))],
    AudioDevice: form.get('audioDevice') === '' ? null : state.audioDevices[Number(form.get('audioDevice'))],
    VideoLine: form.get('videoLine'),
    VideoFormat: form.get('videoFormat'),
    StreamURL: form.get('streamURL'),
    PageURL: form.get('pageURL'),
    NoSignalImagePath: form.get('noSignalImagePath'),
    AudioShift: Number(form.get('audioShift')) || 0
  });
  closeDialog();
  await runAction(index ? 'Update source' : 'Create source', () => index ? state.client.updateSource(Number(index), source) : state.client.addSource(source));
}

async function openDestinationEditor(summary) {
  await runAction('Load output', async () => {
    const destination = await state.client.getDestination(summary.Index);
    openDestinationDialog({ index: summary.Index, destination: destination || summary });
  }, { skipRefresh: true });
}

function openDestinationDialog({ index = null, destination = {} } = {}) {
  const isEdit = index !== null;
  const config = destination.ConversionConfig || {};
  const outputOptions = state.outputDevices.map((device, optionIndex) => renderOption(optionIndex, device.Name, isSameDevice(device, destination.Device))).join('');
  showDialog(`
    <form id="destinationForm" class="dialog destination-dialog" data-index="${isEdit ? index : ''}">
      <div class="dialog-header">
        <div class="dialog-title">${isEdit ? 'Edit Output' : 'Create Output'}</div>
        <button type="button" class="icon-button" data-close-dialog title="Close"><i data-lucide="x"></i></button>
      </div>
      ${renderTextField('name', 'Output name', destination.Name || `Output ${state.destinations.length + 1}`, true)}
      <label><span>Output device</span><select name="device" required ${state.outputDevices.length ? '' : 'disabled'}>${outputOptions || '<option>No output devices loaded</option>'}</select></label>
      ${renderTextField('keyingMode', 'Keying mode', destination.KeyingMode || '')}
      <div class="checkbox-row">
        <input id="conversionEnabled" name="isEnabled" type="checkbox" ${config.IsEnabled ? 'checked' : ''} />
        <label for="conversionEnabled">Enable format conversion</label>
      </div>
      <div class="conversion-grid">
        ${renderSelectField('videoFormat', 'Video format', getConversionOptions('VideoFormats'), config.VideoFormat)}
        ${renderSelectField('frameRate', 'Frame rate', getConversionOptions('FrameRates'), config.FrameRate)}
        ${renderSelectField('interlace', 'Interlace', getConversionOptions('Interlaces'), config.Interlace)}
        ${renderSelectField('audioSampleRate', 'Audio sample rate', getConversionOptions('AudioSampleRates'), config.AudioSampleRate)}
        ${renderSelectField('audioChannel', 'Audio channels', getConversionOptions('AudioChannels'), config.AudioChannel)}
        ${renderSelectField('audioBit', 'Audio bits', getConversionOptions('AudioBits'), config.AudioBit)}
      </div>
      <div class="dialog-actions">
        <button type="button" data-close-dialog><i data-lucide="x"></i><span>Cancel</span></button>
        <button type="submit"><i data-lucide="save"></i><span>${isEdit ? 'Save Output' : 'Create Output'}</span></button>
      </div>
    </form>
  `);
  document.querySelector('#destinationForm').addEventListener('submit', submitDestinationForm);
}

async function submitDestinationForm(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const index = event.currentTarget.dataset.index;
  const destination = removeEmptyFields({
    Name: form.get('name'),
    Device: state.outputDevices[Number(form.get('device'))],
    KeyingMode: form.get('keyingMode'),
    ConversionConfig: removeEmptyFields({
      IsEnabled: form.has('isEnabled'),
      VideoFormat: form.get('videoFormat'),
      FrameRate: form.get('frameRate'),
      Interlace: form.get('interlace'),
      AudioSampleRate: form.get('audioSampleRate'),
      AudioChannel: form.get('audioChannel'),
      AudioBit: form.get('audioBit')
    })
  });
  closeDialog();
  await runAction(index ? 'Update output' : 'Create output', () => index ? state.client.updateDestination(Number(index), destination) : state.client.addDestination(destination));
}

function render() {
  renderList(elements.sources, state.sources, state.selectedSource, 'source', (item) => {
    state.selectedSource = item.Index;
    render();
  }, openSourceEditor, 'source');
  renderList(elements.destinations, state.destinations, state.selectedDestination, 'output', (item) => {
    state.selectedDestination = item.Index;
    render();
  }, openDestinationEditor, 'destination');
  renderChannels();
  elements.resources.innerHTML = renderResources(state.resources);
  elements.selection.innerHTML = renderSelection();
  renderLog();
}

function renderList(container, items, selectedIndex, kind, onSelect, onEdit, dragKind) {
  container.innerHTML = items.length
    ? items.map((item) => `
      <button class="row ${item.Index === selectedIndex ? 'selected' : ''}" data-index="${item.Index}" draggable="true">
        <span class="row-title">${escapeHtml(item.Name)}</span>
        <span class="row-meta">${escapeHtml(renderItemMeta(item, kind))}</span>
      </button>
    `).join('')
    : `<div class="empty">No ${kind}s loaded</div>`;

  container.querySelectorAll('.row').forEach((row) => {
    let clickTimer = null;
    row.addEventListener('click', () => {
      window.clearTimeout(clickTimer);
      clickTimer = window.setTimeout(() => selectListRow(row, items, onSelect), 180);
    });
    row.addEventListener('dblclick', () => {
      window.clearTimeout(clickTimer);
      const item = items.find((candidate) => candidate.Index === Number(row.dataset.index));
      if (item) {
        onEdit(item);
      }
    });
    row.addEventListener('dragstart', (event) => {
      const item = items.find((candidate) => candidate.Index === Number(row.dataset.index));
      if (item) {
        document.body.classList.add('dragging-dashboard-item');
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.dropEffect = 'copy';
        event.dataTransfer.setData('application/json', JSON.stringify({ kind: dragKind, index: item.Index, name: item.Name }));
        event.dataTransfer.setData('text/plain', `${dragKind}: ${item.Name}`);
        event.dataTransfer.setDragImage(createDragImage(kind, item.Name), 18, 18);
      }
    });
  });
}

function renderItemMeta(item, kind) {
  if (kind === 'output') {
    return `${item.Device?.Name || item.Device || 'No device'}${item.ConversionConfig?.IsEnabled ? ' | conversion on' : ''}`;
  }
  return item.Device || item.VideoDevice?.Name || 'No device';
}

function selectListRow(row, items, onSelect) {
  const item = items.find((candidate) => candidate.Index === Number(row.dataset.index));
  if (item) {
    onSelect(item);
  }
}

function renderChannels() {
  elements.channels.innerHTML = state.channels.length
    ? state.channels.map((channel) => `
      <button class="channel ${channel.Index === state.selectedChannel ? 'selected' : ''}" data-index="${channel.Index}">
        ${renderChannelPreview(channel)}
        <span class="channel-index">CH ${channel.Index}</span>
        <span class="channel-source">${escapeHtml(channel.SourceName || 'Not Specified')}</span>
        <span class="channel-dests">${escapeHtml((channel.Destinations || []).join(', ') || 'No outputs')}</span>
        <span class="badges">
          ${channel.IsConverting ? '<b class="badge rec">LIVE</b>' : '<b class="badge">IDLE</b>'}
          ${channel.IsAudioPreview ? '<b class="badge sync">AUDIO</b>' : ''}
        </span>
        <span class="channel-stats">${escapeHtml(channel.ConvertingDuration || '00:00:00')} | ${escapeHtml(channel.ConvertingFPS || '0.00')} fps | drops ${escapeHtml(channel.ConvertingDrops || '0')} | buffered ${escapeHtml(channel.ConvertingBuffered || '0')}</span>
      </button>
    `).join('')
    : '<div class="empty">No channels loaded</div>';

  elements.channels.querySelectorAll('.channel').forEach((row) => {
    let clickTimer = null;
    row.addEventListener('click', () => {
      window.clearTimeout(clickTimer);
      clickTimer = window.setTimeout(() => {
        state.selectedChannel = Number(row.dataset.index);
        render();
      }, 180);
    });
    row.addEventListener('dblclick', () => {
      window.clearTimeout(clickTimer);
      openChannelDialog(Number(row.dataset.index));
    });
    row.addEventListener('dragenter', applyDragTarget);
    row.addEventListener('dragover', applyDragTarget);
    row.addEventListener('dragleave', () => row.classList.remove('drop-target'));
    row.addEventListener('drop', (event) => {
      event.preventDefault();
      row.classList.remove('drop-target');
      const payload = getDragPayload(event);
      if (payload) {
        applyDropToChannel(Number(row.dataset.index), payload);
      }
    });
  });
}

function renderChannelPreview(channel) {
  const sourceName = channel.SourceName || '';
  const hasSource = sourceName && sourceName !== 'Not Specified';
  const preview = state.channelPreviews.get(channel.Index);

  if (!hasSource) {
    return '<span class="channel-preview empty-preview">No source</span>';
  }
  if (preview?.status === 'ready') {
    return `<span class="channel-preview"><img src="${escapeHtml(preview.src)}" alt="" /></span>`;
  }
  if (preview?.status === 'error') {
    return '<span class="channel-preview empty-preview">No preview</span>';
  }
  return '<span class="channel-preview empty-preview">Loading</span>';
}

function renderSelection() {
  const channel = state.channels.find((item) => item.Index === state.selectedChannel);
  if (!channel) {
    return '<div class="empty">No channel selected</div>';
  }

  return `
    <div class="selected-card">
      <div class="detail-row"><span>Source</span><b>${escapeHtml(channel.SourceName || 'Not Specified')}</b></div>
      <div class="detail-row"><span>Outputs</span><b>${escapeHtml((channel.Destinations || []).join(', ') || 'None')}</b></div>
      <div class="detail-row"><span>Status</span><b>${channel.IsConverting ? 'Converting' : 'Idle'}</b></div>
      <div class="detail-row"><span>Breaks</span><b>${escapeHtml(channel.ConvertingBreaks || '0')}</b></div>
      <div class="detail-row"><span>Drops</span><b>${escapeHtml(channel.ConvertingDrops || '0')}</b></div>
      <div class="detail-row"><span>Buffered</span><b>${escapeHtml(channel.ConvertingBuffered || '0')}</b></div>
    </div>
  `;
}

async function openChannelDialog(channelIndex) {
  await runAction('Load channel', async () => {
    const channel = await state.client.getChannel(channelIndex);
    const preview = state.channelPreviews.get(channelIndex);
    showDialog(`
      <div class="dialog channel-dialog" data-channel-dialog="${channelIndex}">
        <div class="dialog-header">
          <div class="dialog-title">Channel ${channelIndex}</div>
          <button type="button" class="icon-button" data-close-dialog title="Close"><i data-lucide="x"></i></button>
        </div>
        <div class="channel-dialog-top">
          <div class="channel-dialog-preview">${preview?.status === 'ready' ? `<img src="${escapeHtml(preview.src)}" alt="" />` : 'No preview'}</div>
          <div class="channel-dialog-side">
            <div class="channel-dialog-status">
              ${channel.IsConverting ? '<span class="status-pill active">Converting</span>' : '<span class="status-pill">Idle</span>'}
              ${channel.IsAudioPreview ? '<span class="status-pill sync">Audio Preview</span>' : ''}
            </div>
            <div class="channel-dialog-actions">
              <button data-channel-action="start"><i data-lucide="play"></i><span>Convert</span></button>
              <button data-channel-action="stop"><i data-lucide="square"></i><span>Stop</span></button>
            </div>
          </div>
        </div>
        <div class="channel-dialog-stats">
          ${renderChannelStat('Duration', channel.ConvertingDuration)}
          ${renderChannelStat('FPS', channel.ConvertingFPS)}
          ${renderChannelStat('Breaks', channel.ConvertingBreaks)}
          ${renderChannelStat('Drops', channel.ConvertingDrops)}
          ${renderChannelStat('Buffered', channel.ConvertingBuffered)}
          ${renderChannelStat('Source', channel.SourceName)}
        </div>
      </div>
    `);
    document.querySelector('[data-channel-action="start"]').addEventListener('click', () => runAction('Start conversion', () => state.client.startChannelConversion(channelIndex)));
    document.querySelector('[data-channel-action="stop"]').addEventListener('click', () => runAction('Stop conversion', () => state.client.stopChannelConversion(channelIndex)));
  }, { skipRefresh: true });
}

function renderChannelStat(label, value) {
  return `<div class="channel-stat-card"><span>${escapeHtml(label)}</span><b>${escapeHtml(value || '-')}</b></div>`;
}

function renderResources(resources) {
  const metrics = normalizeResources(resources);
  if (!metrics) {
    return '<div class="empty">No resources loaded</div>';
  }
  const ramPercent = metrics.totalRam > 0 ? (metrics.currentRam / metrics.totalRam) * 100 : 0;
  return `
    <div class="resource-summary">
      ${renderMetricCard('CPU', `${formatNumber(metrics.currentCpu)}% current`, metrics.currentCpu)}
      ${renderMetricCard('RAM', `${formatNumber(metrics.currentRam)} / ${formatNumber(metrics.totalRam)} GB`, ramPercent)}
      ${renderMetricCard('Total CPU', `${formatNumber(metrics.totalCpu)} GHz`, Math.min(metrics.totalCpu * 10, 100))}
    </div>
  `;
}

function renderMetricCard(label, value, percent) {
  const clampedPercent = clampNumber(Number(percent), 0, 100);
  const tone = clampedPercent >= 85 ? 'danger' : clampedPercent >= 70 ? 'warn' : 'ok';
  return `
    <div class="resource-card ${tone}">
      <div class="resource-card-header"><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>
      <div class="meter"><span style="width: ${clampedPercent}%"></span></div>
    </div>
  `;
}

async function refreshChannelPreviews({ force = false } = {}) {
  const refreshId = ++state.previewRefreshId;
  const activeChannelKeys = new Set();
  const previewTasks = [];

  for (const channel of state.channels) {
    const sourceName = channel.SourceName || '';
    const hasSource = sourceName && sourceName !== 'Not Specified';
    const previewKey = `${channel.Index}:${sourceName}`;
    if (!hasSource) {
      state.channelPreviews.delete(channel.Index);
      continue;
    }
    activeChannelKeys.add(previewKey);
    if (!force && state.channelPreviews.get(channel.Index)?.key === previewKey) {
      continue;
    }
    state.channelPreviews.set(channel.Index, { key: previewKey, status: 'loading' });
    previewTasks.push(loadChannelPreview(channel.Index, previewKey, refreshId));
  }

  for (const [index, preview] of state.channelPreviews) {
    if (!activeChannelKeys.has(preview.key)) {
      state.channelPreviews.delete(index);
    }
  }

  if (previewTasks.length) {
    renderChannels();
    await Promise.allSettled(previewTasks);
  }
}

async function loadChannelPreview(index, key, refreshId) {
  try {
    const base64 = await withTimeout((signal) => state.client.getChannelPreview(index, { signal }), 6000);
    if (refreshId === state.previewRefreshId) {
      state.channelPreviews.set(index, { key, status: 'ready', src: toPreviewImageSrc(base64) });
    }
  } catch {
    if (refreshId === state.previewRefreshId) {
      state.channelPreviews.set(index, { key, status: 'error' });
    }
  }
  renderChannels();
}

function schedulePreviewUpdates() {
  window.clearInterval(state.previewTimerId);
  state.previewTimerId = null;
  if (state.previewUpdateSeconds && state.channels.some((channel) => channel.SourceName && channel.SourceName !== 'Not Specified')) {
    state.previewTimerId = window.setInterval(() => refreshChannelPreviews({ force: true }), state.previewUpdateSeconds * 1000);
  }
}

function scheduleResourceUpdates() {
  window.clearInterval(state.resourceTimerId);
  state.resourceTimerId = null;
  if (state.resourceUpdateSeconds) {
    state.resourceTimerId = window.setInterval(refreshResources, state.resourceUpdateSeconds * 1000);
  }
}

function scheduleChannelStatsUpdates() {
  window.clearInterval(state.channelStatsTimerId);
  state.channelStatsTimerId = null;
  if (state.channelStatsUpdateSeconds) {
    state.channelStatsTimerId = window.setInterval(refreshChannelStats, state.channelStatsUpdateSeconds * 1000);
  }
}

async function refreshResources() {
  try {
    state.resources = await state.client.getResources();
    elements.resources.innerHTML = renderResources(state.resources);
  } catch (error) {
    pushLog(`Resources update: ${error.message}`);
    renderLog();
  }
}

async function refreshChannelStats() {
  try {
    state.channels = toList(await state.client.getChannels());
    renderChannels();
    elements.selection.innerHTML = renderSelection();
    refreshChannelPreviews();
  } catch (error) {
    pushLog(`Channel stats update: ${error.message}`);
    renderLog();
  }
}

function acceptDashboardDrag(event) {
  if (document.body.classList.contains('dragging-dashboard-item') || Array.from(event.dataTransfer?.types || []).includes('application/json')) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }
}

function applyDragTarget(event) {
  event.preventDefault();
  event.currentTarget.classList.add('drop-target');
  event.dataTransfer.dropEffect = 'copy';
}

async function applyDropToChannel(channelIndex, payload) {
  if (payload.kind === 'source') {
    await runAction(`Drop source on CH ${channelIndex}`, () => state.client.setChannelSource(channelIndex, payload.name));
  } else if (payload.kind === 'destination') {
    await runAction(`Drop output on CH ${channelIndex}`, () => state.client.addChannelDestination(channelIndex, payload.name));
  }
}

function getDragPayload(event) {
  try {
    const text = event.dataTransfer.getData('application/json');
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function createDragImage(kind, name) {
  const element = document.createElement('div');
  element.className = 'drag-ghost';
  element.textContent = `${kind}: ${name}`;
  document.body.append(element);
  window.setTimeout(() => element.remove(), 0);
  return element;
}

function clearDragState() {
  document.body.classList.remove('dragging-dashboard-item');
  document.querySelectorAll('.drop-target').forEach((element) => element.classList.remove('drop-target'));
}

function showDialog(html) {
  elements.modalRoot.innerHTML = `<div class="modal-backdrop">${html}</div>`;
  createIcons({ icons: { X, Save, Play, Square } });
  elements.modalRoot.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', closeDialog));
  elements.modalRoot.querySelector('.modal-backdrop').addEventListener('click', (event) => {
    if (event.target.classList.contains('modal-backdrop')) {
      closeDialog();
    }
  });
}

function closeDialog() {
  elements.modalRoot.innerHTML = '';
}

function saveLog() {
  const blob = new Blob([getLogText()], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `directconvert-dashboard-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function openLogTab() {
  const tab = window.open('', '_blank', 'noopener,noreferrer');
  if (tab) {
    tab.document.write(`<pre>${escapeHtml(getLogText())}</pre>`);
    tab.document.close();
  }
}

function renderTextField(name, label, value, required = false) {
  return `<label><span>${escapeHtml(label)}</span><input name="${escapeHtml(name)}" value="${escapeHtml(value)}" ${required ? 'required' : ''} /></label>`;
}

function renderNumberField(name, label, value) {
  return `<label><span>${escapeHtml(label)}</span><input name="${escapeHtml(name)}" type="number" min="0" max="3600" step="1" value="${escapeHtml(value)}" /></label>`;
}

function renderSelectField(name, label, options, value) {
  const normalizedOptions = options.length ? options : [value || 'Original'];
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <select name="${escapeHtml(name)}">
        ${normalizedOptions.map((option) => `<option value="${escapeHtml(option)}" ${option === value ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}
      </select>
    </label>
  `;
}

function renderOption(value, label, selected) {
  return `<option value="${escapeHtml(value)}" ${selected ? 'selected' : ''}>${escapeHtml(label)}</option>`;
}

function getConversionOptions(key) {
  return toList(state.conversionLists[key]);
}

function normalizeResources(resources) {
  const values = normalizeKeyValueList(resources);
  if (!values.CurrentCPU && !values.TotalCPU && !values.CurrentRAM && !values.TotalRAM) {
    return null;
  }
  return {
    currentCpu: Number(values.CurrentCPU) || 0,
    totalCpu: Number(values.TotalCPU) || 0,
    currentRam: Number(values.CurrentRAM) || 0,
    totalRam: Number(values.TotalRAM) || 0
  };
}

function normalizeKeyValueList(value) {
  const entries = Array.isArray(value?.value) ? value.value : value;
  if (!Array.isArray(entries)) {
    return {};
  }
  const result = {};
  for (let index = 0; index < entries.length; index += 2) {
    result[entries[index]] = entries[index + 1];
  }
  return result;
}

function toList(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (Array.isArray(value?.value)) {
    return value.value;
  }
  return [];
}

function removeEmptyFields(value) {
  return Object.fromEntries(Object.entries(value).filter(([, fieldValue]) => {
    return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
  }));
}

function isSameDevice(a, b) {
  return a && b && a.Name === b.Name && a.Type === b.Type && Number(a.Index) === Number(b.Index);
}

function requireChannel() {
  if (state.selectedChannel === null) {
    throw new Error('Select a channel first.');
  }
  return state.selectedChannel;
}

function requireSource() {
  const source = state.sources.find((item) => item.Index === state.selectedSource);
  if (!source) {
    throw new Error('Select a source first.');
  }
  return source;
}

function requireDestination() {
  const destination = state.destinations.find((item) => item.Index === state.selectedDestination);
  if (!destination) {
    throw new Error('Select an output first.');
  }
  return destination;
}

function withTimeout(action, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  return action(controller.signal).finally(() => window.clearTimeout(timeoutId));
}

function toPreviewImageSrc(value) {
  const image = String(value || '').trim();
  return image.startsWith('data:') ? image : `data:image/png;base64,${image}`;
}

function renderLog() {
  elements.log.textContent = state.log.join('\n');
}

function getLogText() {
  return state.log.join('\n') || 'No log entries.';
}

function pushLog(message) {
  state.log = [`${new Date().toLocaleTimeString()} ${message}`, ...state.log].slice(0, 80);
}

function formatNumber(value) {
  return Number(value || 0).toFixed(1);
}

function formatInterval(value) {
  return value ? `every ${value}s` : 'off';
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(Math.round(value), min), max);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function getInitialBaseUrl() {
  return normalizeDashboardBaseUrl(localStorage.getItem('dc.baseUrl') || '/dc-api/');
}

function normalizeDashboardBaseUrl(baseUrl) {
  const url = String(baseUrl || '').trim();
  if (isLocalDirectConvertApiUrl(url)) {
    return '/dc-api/';
  }
  return url || '/dc-api/';
}

function isLocalDirectConvertApiUrl(baseUrl) {
  try {
    const url = new URL(baseUrl);
    return url.port === '9753';
  } catch {
    return false;
  }
}
