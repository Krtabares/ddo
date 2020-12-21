
import asyncio
import requests
from sanic import Sanic
from sanic import request
from sanic.response import json
# import aiosmtplib
from random import randint
from sanic_jinja2 import SanicJinja2
from email.header import Header
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from email.utils import formataddr
from datetime import datetime
from sanic import response
#!/usr/bin/env python3

import smtplib

from email.message import EmailMessage
from email.headerregistry import Address
from email.utils import make_msgid

from sanic.handlers import ErrorHandler
app = Sanic(__name__)
jinja = SanicJinja2(app)

class CustomHandler(ErrorHandler):
    def default(self, request, exception):
        # print("[EXCEPTION] "+str(exception))
        return response.json(str(exception),501)
handler = CustomHandler()
app.error_handler = handler

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
    # data = request.json
    await _send_email2("")
    return json(f"SUCCESS!")


async def _send_email2(data):
    sender_email = "ddoesteinfo@gmail.com"
    receiver_email = "krtabares@gmail.com"
    password = "Caracas2020$"

    message = MIMEMultipart("alternative")
    message["Subject"] = "multipart test"
    message["From"] = sender_email
    message["To"] = receiver_email

    # Create the plain-text and HTML version of your message
    text = """\
    Hi,
    How are you?
    Real Python has many great tutorials:
    www.realpython.com"""
    html = """\
    <html>
    <body>
        <p>Hi,<br>
        How are you?<br>
        <a href="http://www.realpython.com">Real Python</a> 
        has many great tutorials.
        </p>
    </body>
    </html>
    """

    # Turn these into plain/html MIMEText objects
    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")

    # Add HTML/plain-text parts to MIMEMultipart message
    # The email client will try to render the last part first
    message.attach(part1)
    message.attach(part2)

    # Create secure connection with server and send email
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 587, context=context) as server:
        server.login(sender_email, password)
        server.sendmail(
            sender_email, receiver_email, message.as_string()
        )
    return "SUCCESS"


app.run(port=8888, debug=True)

