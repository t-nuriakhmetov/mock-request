const { Polly } = require('@pollyjs/core');
const { MODES } = require('@pollyjs/utils');
const FSPersister = require('@pollyjs/persister-fs');
const adapter = require('@pollyjs/adapter-puppeteer');
const { output } = codeceptjs;
const { getRouteHandler } = require('../scripts/mock');
const PuppeteerAdapter = require('../scripts/puppeteerAdapter');

class PuppeteerConnector {

  constructor(Puppeteer, options) {
    if (!Puppeteer.page) {
      throw new Error('Puppeteer page must be opened');
    }
    this.Puppeteer = Puppeteer;
    this.page = Puppeteer.page;
    this.options = options;

    Polly.register(FSPersister);
    Polly.register(adapter);    
  }

  async connect(title, configOpts = {}) {

    const defaultConfig = {
      mode: MODES.PASSTHROUGH,
      adapters: [PuppeteerAdapter],
      adapterOptions: {
        puppeteer: { 
          page: this.Puppeteer.page,
          requestResourceTypes: ['xhr', 'fetch'],
        },
      },
      logging: false,
      persister: 'fs',
      persisterOptions: {
        fs: {
          recordingsDir: './data/requests'
        }
      }      
    };
    
    await this.Puppeteer.page.setRequestInterception(true);
    this.polly = new Polly(title, { ...defaultConfig, ...this.options, ...configOpts });
    this.polly.logger.disconnect();

    this.polly.server
    .any()
    .on('error', (request, error) => {
      if (error.toString().includes('already handled')) return;
      output.debug(`Errored ➞ ${request.method} ${request.url}: ${error.message}`);
    })
    .on('response', (request) => {
      output.debug(`Request ${request.action} ➞ ${request.method} ${request.url} ${request.response.statusCode} • ${request.responseTime}ms`);        
    });
  }

  async isConnected() {
    return this.polly && this.polly.server;
  }

  async checkConnection() {
    if (!await this.isConnected()) return this.connect('Test');
  }

  async mockRequest(method, oneOrMoreUrls, dataOrStatusCode, additionalData = null) {
    const puppeteerConfigUrl = this.Puppeteer && this.Puppeteer.options.url;

    const handler = getRouteHandler(
      this.polly.server,
      method,
      oneOrMoreUrls,
      this.options.url || puppeteerConfigUrl,
    );

    if (typeof dataOrStatusCode === 'number') {
      const statusCode = dataOrStatusCode;
      if (additionalData) {
        return handler.intercept((_, res) => res.status(statusCode).send(additionalData));
      }
      return handler.intercept((_, res) => res.sendStatus(statusCode));
    }
    const data = dataOrStatusCode;
    return handler.intercept((_, res) => res.send(data));    
  }

  async mockServer(configFn) {
    configFn(this.polly.server);
  }

  async record() {
    return this.polly.record();
  }

  async replay() {
    return this.polly.replay();
  }

  async passthrough() {
    return this.polly.passthrough();
  }

  async flush() {
    return this.polly.flush();
  }
 
  async disconnect() {
    try {
      await this.polly.stop();
      await this.Puppeteer.page.setRequestInterception(false);
    } catch (err) {
      output.log('Polly was not disconnected, Puppeteer is already closed');
    }
  }

}

module.exports = PuppeteerConnector;
