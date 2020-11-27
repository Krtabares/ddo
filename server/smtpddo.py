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
    data = request.json
    await _send_email(data)
    return json(f"SUCCESS!")


async def _send_email2():
    # Create the base text message.
    msg = EmailMessage()
    msg['Subject'] = "Ayons asperges pour le déjeuner"
    msg['From'] = Address("Pepé Le Pew", "pepe", "noreply@del-oeste.com")
    msg['To'] = (Address("krtabares@gmail.com"),)
    msg.set_content("""\
    Salut!

    Cela ressemble à un excellent recipie[1] déjeuner.

    [1] http://www.yummly.com/recipe/Roasted-Asparagus-Epicurious-203718

    --Pepé
    """)

    # Add the html version.  This converts the message into a multipart/alternative
    # container, with the original text message as the first part and the new html
    # message as the second part.
    asparagus_cid = make_msgid()
    msg.add_alternative("""\
    <html>
    <head></head>
    <body>
        <p>Salut!</p>
        <p>Cela ressemble à un excellent
            <a href="http://www.yummly.com/recipe/Roasted-Asparagus-Epicurious-203718">
                recipie
            </a> déjeuner.
        </p>
        <img src="cid:{asparagus_cid}" />
    </body>
    </html>
    """.format(asparagus_cid=asparagus_cid[1:-1]), subtype='html')
    # note that we needed to peel the <> off the msgid for use in the html.

    # Now add the related image to the html part.
    with open("roasted-asparagus.jpg", 'rb') as img:
        msg.get_payload()[1].add_related(img.read(), 'image', 'jpeg',
                                        cid=asparagus_cid)

    # Make a local copy of what we are going to send.
    with open('outgoing.msg', 'wb') as f:
        f.write(bytes(msg))

    # Send the message via local SMTP server.
    with smtplib.SMTP('localhost') as s:
        s.send_message(msg)


app.run(port=8888, debug=True)