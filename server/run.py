# SERVER
import asyncio
from sanic import Sanic
from sanic import response
from sanic_cors import CORS, cross_origin
from sanic.handlers import ErrorHandler
from sanic.exceptions import SanicException
from motor.motor_asyncio import AsyncIOMotorClient

class CustomHandler(ErrorHandler):
    def default(self, request, exception):
        return response.json('NO',501)

def get_db():
    mongo_uri = "mongodb://127.0.0.1:27017/admin"
    client = AsyncIOMotorClient(mongo_uri)
    db = client['thas']
    return db




host = '0.0.0.0'
port = 35000
handler = CustomHandler()
app.error_handler = handler
app = Sanic(__name__)

app.run(host=host, port = PORT, debug = False)
