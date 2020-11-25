import asyncio
from sanic import Sanic
from sanic import request
from sanic.response import json
import aiosmtplib
from random import randint
from sanic_jinja2 import SanicJinja2
from email.header import Header
from email.mime.text import MIMEText
from email.utils import formataddr
from datetime import datetime
app = Sanic(__name__)
jinja = SanicJinja2(app)
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
        message = MIMEText('Esto es una prueba de correos.')
        message['From'] = formataddr(
            (str(Header('Droguería del Oeste', 'utf-8')), 'noreply@del-oeste.com'))
        message['To'] = data.get('to')
        message['Subject'] = data.get('subject')
        print(await server.send_message(message))
    await sendNewMessage()
@app.route('/put', methods=["POST"])
async def check(request):
    data = request.json
    await _send_email(data)
    return json(f"SUCCESS!")