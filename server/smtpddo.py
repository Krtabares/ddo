import asyncio
import aiohttp
import unidecode
import uuid
import aiosmtplib
import socketio
import requests
import random
import cx_Oracle
import traceback
from datetime import datetime, timedelta
from sanic import Sanic
from sanic import response
from sanic_cors import CORS, cross_origin
from sanic.handlers import ErrorHandler
from sanic.exceptions import SanicException
from sanic.log import logger
from sanic_jwt_extended import (JWTManager, jwt_required, create_access_token,create_refresh_token)
from sanic_jwt_extended.exceptions import JWTExtendedException
from sanic_jwt_extended.tokens import Token
from motor.motor_asyncio import AsyncIOMotorClient
from sanic.exceptions import ServerError
from sanic_openapi import swagger_blueprint
from sanic_openapi import doc
from sanic_compress import Compress
from sanic_jinja2 import SanicJinja2
from email.header import Header
from email.mime.text import MIMEText
from email.utils import formataddr
from datetime import datetime

app = Sanic(__name__)
sio = socketio.AsyncServer(async_mode='sanic')
sio.attach(app)
# handler = CustomHandler()
# app.error_handler = handler
app.config.JWT_SECRET_KEY = "ef8f6025-ec38-4bf3-b40c-29642ccd6312"
app.config.JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=120)
app.config.RBAC_ENABLE = True
jwt = JWTManager(app)
app.blueprint(swagger_blueprint)
CORS(app, automatic_options=True)
Compress(app)

jinja = SanicJinja2(app)


def get_mongo_db():
    mongo_uri = "mongodb://127.0.0.1:27017/ddo"
    client = AsyncIOMotorClient(mongo_uri)
    db = client['ddo']
    return db

async def _send_email(data):
    MAIL_SERVER_HOST = "mail.del-oeste.com"
    MAIL_SERVER_PORT = 587
    MAIL_SERVER_USER = 'noreply@del-oeste.com'
    MAIL_SERVER_USER2 = 'info@del-oeste.com'
    MAIL_SERVER_PASSWORD = 'BpNFrb3KxpnKmU'
    #Thanks: https://github.com/cole/aiosmtplib/issues/1
    host = MAIL_SERVER_HOST
    port = MAIL_SERVER_PORT
    user = MAIL_SERVER_USER
    password = MAIL_SERVER_PASSWORD
    bodyHtml = {}
    loop = asyncio.get_event_loop()
    server = aiosmtplib.SMTP(host, port, use_tls=False)
    await server.connect()
    # await server.starttls()
    await server.login(user, password)
    bodyHtml = {}
    async def sendNewMessage():
        # message = MIMEText(data.get('template'), 'html')
        message = MIMEText(data.get('template'))
        message['From'] = formataddr(
            (str(Header('Droguería del Oeste', 'utf-8')), 'noreply@del-oeste.com'))
        message['To'] = data.get('to')
        message['Subject'] = data.get('subject')
        print(await server.send_message(message))
    await sendNewMessage()

async def prepareMail(data):
    mypass = '52400ede39b6a2098dc0ffb5aad536e6'
    data['template'] ="""<!doctype html>
        <html lang="en-US">

        <head>
            <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
            <title>Reset Password Email Template</title>
            <meta name="description" content="Reset Password Email Template.">
            <style type="text/css">
                a:hover {text-decoration: underline !important;}
            </style>
        </head>

        <body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
            <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
                style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
                <tr>
                    <td>
                        <table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
                            align="center" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="height:80px;">&nbsp;</td>
                            </tr>
                            <tr>
                                <td style="text-align:center;">
                                <a href="http://www.del-oeste.com/" title="logo" target="_blank">
                                    <img src="http://www.del-oeste.com/wp-content/uploads/2017/11/drogueria-del-oeste-bur-sin-rif-v3.png" title="logo" alt="logo">
                                </a>
                                </td>
                            </tr>
                            <tr>
                                <td style="height:20px;">&nbsp;</td>
                            </tr>
                            <tr>
                                <td>
                                    <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
                                        style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
                                        <tr>
                                            <td style="height:40px;">&nbsp;</td>
                                        </tr>
                                        <tr>
                                            <td style="padding:0 35px;">
                                                <h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">
                                                    Ha solicitado restablecer su contraseña</h1>
                                                <span
                                                    style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
                                                <p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
                                                    
                                                    No podemos simplemente enviarle su contraseña anterior. Se ha generado una contraseña para usted

                                                    Password: <strong> """+mypass+"""</strong>


                                                </p>

                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="height:40px;">&nbsp;</td>
                                        </tr>
                                    </table>
                                </td>
                            <tr>
                                <td style="height:20px;">&nbsp;</td>
                            </tr>
                            <tr>
                                <td style="text-align:center;">
                                    <p style="font-size:14px; color:rgba(69, 80, 86, 0.7411764705882353); line-height:18px; margin:0 0 0;">&copy; <strong>http://www.del-oeste.com</strong></p>
                                </td>
                            </tr>
                            <tr>
                                <td style="height:80px;">&nbsp;</td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>

        </html> """
    await _send_email(data)
    return response.json({'success'}, 200)
    
# @app.route('/put', methods=["POST"])
# async def check(request):
#     data = request.json
#     await _send_email(data)
#     return json(f"SUCCESS!")

@app.route('/put', ["POST", "GET"])
async def availableUser(request):
    data = request.json
    db = get_mongo_db()
    # username = data.get("username", None)
    user = None

    if 'username' in data : 
        user = await db.user.find_one({'username' : data.get("username", None)}, {'_id' : 0})

    elif user == None : 
        user = await db.user.find_one({'email' : data.get("username", None)}, {'_id' : 0})
    
    else:
        response.json({"msg": "Missing username parameter"}, status=400)

    if user == None:
        response.json({"msg": "Missing username parameter"}, status=400)

    print(user)

    emailData = dict(
        template = "",
        to = user['email'],
        subject = "Reinicio de Password"
    )

    await prepareMail(emailData)

    return response.json(user,200)    
app.run(port=8888, debug=True)