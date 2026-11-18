import { describe, expect, it } from 'vitest';
import { cacheVersion, serviceWorkerSource } from './serviceWorker';

describe('service worker', () => {
  const files = ['index.html', 'assets/index-abc.js', 'icon.svg'];

  it('precaches the page and every built file, relative to its scope', () => {
    const source = serviceWorkerSource(files);
    expect(source).toContain('"./"');
    expect(source).toContain('"./index.html"');
    expect(source.match(/"\.\/index\.html"/g)).toHaveLength(1);
    for (const f of files) expect(source).toContain(`"./${f}"`);
  });

  it('names caches by scope, so other games on the origin keep theirs', () => {
    expect(serviceWorkerSource(files)).toContain(
      "const PREFIX = 'noosphere:' + self.registration.scope + ':';",
    );
  });

  it('changes version when the build changes and not when only the order does', () => {
    expect(cacheVersion(files)).toBe(cacheVersion([...files].reverse()));
    expect(cacheVersion(files)).not.toBe(cacheVersion([...files, 'assets/index-def.js']));
  });

  it('is valid JavaScript', () => {
    expect(() => new Function(serviceWorkerSource(files))).not.toThrow();
  });
});
