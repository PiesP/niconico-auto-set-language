import assert from 'node:assert/strict';
import test from 'node:test';

class FakeMutationObserver {
  static instances: FakeMutationObserver[] = [];
  disconnectCalls = 0;

  constructor(_callback: MutationCallback) {
    FakeMutationObserver.instances.push(this);
  }

  observe(): void {}

  disconnect(): void {
    this.disconnectCalls += 1;
  }
}

class FakeForm extends EventTarget {
  action = '';
  submitCalls = 0;

  submit(): void {
    this.submitCalls += 1;
  }

  closest(): HTMLFormElement {
    return this as unknown as HTMLFormElement;
  }
}

class FakeInput {
  form: HTMLFormElement;
  value = 'en-us';

  constructor(form: HTMLFormElement) {
    this.form = form;
  }

  closest(): HTMLFormElement {
    return this.form;
  }
}

class FakeDocument extends EventTarget {
  readyState = 'complete';
  body: { appendChild: () => undefined } | null = {
    appendChild: () => undefined,
  };
  showLanguageForm = false;
  readonly form = new FakeForm();
  readonly input = new FakeInput(this.form as unknown as HTMLFormElement);
  readonly watchContainer = {};

  querySelector<T>(selector: string): T | null {
    if (selector === 'form input[name="language"]') {
      return (this.showLanguageForm ? this.input : null) as T | null;
    }
    if (selector === '#watch-page-container' || selector === '#root') {
      return this.watchContainer as T;
    }
    return null;
  }

  createElement(): {
    style: { cssText: string; transition?: string; opacity?: string };
    setAttribute: () => void;
    addEventListener: () => void;
    remove: () => void;
  } {
    return {
      style: { cssText: '' },
      setAttribute: () => undefined,
      addEventListener: () => undefined,
      remove: () => undefined,
    };
  }
}

class FakeWindow extends EventTarget {
  location = { href: 'https://www.nicovideo.jp/watch/initial' };
  setTimeout = globalThis.setTimeout.bind(globalThis);
  clearTimeout = globalThis.clearTimeout.bind(globalThis);
}

test('rechecks a language form after SPA navigation', async () => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const previousMutationObserver = globalThis.MutationObserver;
  const previousHtmlFormElement = globalThis.HTMLFormElement;
  const fakeWindow = new FakeWindow();
  const fakeDocument = new FakeDocument();

  Object.assign(globalThis, {
    window: fakeWindow,
    document: fakeDocument,
    MutationObserver: FakeMutationObserver,
    HTMLFormElement: FakeForm,
  });

  try {
    await import(`../src/niconico-auto-set-language.user.ts?test=${Date.now()}`);
    fakeDocument.body = null;
    fakeDocument.showLanguageForm = true;
    fakeWindow.location.href = 'https://www.nicovideo.jp/watch/next';
    fakeWindow.dispatchEvent(new Event('popstate'));
    await new Promise((resolve) => setTimeout(resolve, 150));

    assert.equal(fakeDocument.form.submitCalls, 1);
  } finally {
    Object.assign(globalThis, {
      window: previousWindow,
      document: previousDocument,
      MutationObserver: previousMutationObserver,
      HTMLFormElement: previousHtmlFormElement,
    });
    FakeMutationObserver.instances = [];
  }
});
