/// <reference path="../typings/index.d.ts" />

import * as express from 'express'
import * as path from 'path'
import * as cors from 'cors'
import * as bodyParser from 'body-parser'

const staticService = require('express-static')

class TsAppDevServer {
  public app = express()
  public port = 3004
  public staticPath = path.join(__dirname, 'public')

  constructor () {
    this.setupServer()
  }

  private setupMiddleware(): void {
    this.app.use(cors())
    this.app.use(bodyParser.urlencoded({ extended: true }))
    this.app.use(bodyParser.json())
    this.app.use(staticService(this.staticPath))
  }

  private setupServer(): void {
    this.setupMiddleware()
    // 启动服务
    this.app.listen(this.port, () => {
      console.info('----\n==> 🌎  Server is running on port %s', this.port)
    })
  }
}

new TsAppDevServer()
