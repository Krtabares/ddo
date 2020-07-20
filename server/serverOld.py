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

class CustomHandler(ErrorHandler):
    def default(self, request, exception):
        print("[EXCEPTION] "+str(exception))
        return response.json('NO',501)

app = Sanic(__name__)
port = 3500
users = [{'username':'admin', 'password': 'ddo.admin', 'role': 'admin', 'name': 'admin'}, 
{'username':'aplaza', 'password': 'pla04.admin', 'role': 'user', 'name': 'automercado Plaza', 'COD_CIA': '01','GRUPO_CLIENTE': '01','COD_CLIENTE': 'PLA04' },
{'username':'atia', 'password': 'atia.admin', 'role': 'user', 'name': 'clinica atias', 'COD_CIA': '01','GRUPO_CLIENTE': '01','COD_CLIENTE': 'ATIA' },
{'username':'bmilag', 'password': 'bmilag.admin', 'role': 'user', 'name': 'fuser', 'COD_CIA': '01','GRUPO_CLIENTE': '01', 'COD_CLIENTE': 'BMILAG'}]
sio = socketio.AsyncServer(async_mode='sanic')
sio.attach(app)
handler = CustomHandler()
app.error_handler = handler 
app.config.JWT_SECRET_KEY = "ef8f6025-ec38-4bf3-b40c-29642ccd6312"
app.config.JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=120)
app.config.RBAC_ENABLE = True
jwt = JWTManager(app)
app.blueprint(swagger_blueprint)
CORS(app, automatic_options=True)
Compress(app)


def get_mongo_db():
    mongo_uri = "mongodb://127.0.0.1:27017/admin"
    client = AsyncIOMotorClient(mongo_uri)
    db = client['thas']
    return db

def get_db():
    dsn_tns = cx_Oracle.makedsn('192.168.168.218', '1521', service_name='DELOESTE')
    # if needed, place an 'r' before any parameter in order to address special characters such as '\'.
    conn = cx_Oracle.connect(user=r'PAGINAWEB', password='paginaweb', dsn=dsn_tns)
    #conn = cx_Oracle.connect(user=r'paginaweb', password='paginaweb', dsn=dsn_tns)
    # if needed, place an 'r' before any parameter in order to address special characters such as '\'.
    #For example, if your user name contains '\', you'll need to place 'r' before the user name: user=r'User Name'
    return conn

def searchUser(username, password):
    for item in users:
        if item["username"] == username and item["password"] == password:
            return item
    return False

@app.route("/login", ["POST", "GET"])
async def login(request):
    data = request.json
    username = data.get("username", None)
    password = data.get("password", None)

    if not username:
        return response.json({"msg": "Missing username parameter"}, status=400)
    if not password:
        return response.json({"msg": "Missing password parameter"}, status=400)

    user = searchUser(username, password)

    if not user:
        return response.json({"msg": "Bad username or password"}, status=403)

    access_token = await create_access_token(identity=username, app=request.app)
    return response.json({'access_token': access_token, 'user': user}, 200)

@app.route("/refresh_token", ["POST", "GET"])
async def refresh_token(request):
    refresh_token = await create_refresh_token( identity=str(uuid.uuid4()), app=request.app )
    return response.json({'refresh_token': refresh_token}, status=200)

@app.route('/add/user', ["POST", "GET"])
@jwt_required
async def addUser(request, token : Token):
    user = request.json
    if user:
        users.append(user)
    return response.json("OK", 200)

@app.route('/get/user', ["POST", "GET"])
@jwt_required
async def listUser(request, token : Token):
    data = request.json
    return response.json(users,200)

@app.route('/procedure_clientes', ["POST", "GET"])
async def procedure(request):

    data = request.json

    db = get_db()
    c = db.cursor()
    print(data)
    if not 'pTotReg' in data or data['pTotReg'] == 0 :
        data['pTotReg'] = 100

    if not 'pTotPaginas' in data or data['pTotPaginas'] == 0 :
        data['pTotPaginas'] = 100
    
    if not 'pPagina' in data  :
        data['pPagina'] = 'null'

    if not 'pLineas' in data or data['pLineas'] == 0 :
        data['pLineas'] = 100
    
    if not 'pDireccion' in data :
        data['pDireccion'] = 'null'
    else:
        data['pDireccion'] = "'"+data['pDireccion']+"'"

    if not 'pCLiente' in data :
        data['pCLiente'] = 'null'
    else:
        data['pCLiente'] = "'"+data['pCLiente']+"'"
    
    if not 'pNombre' in data :
        data['pNombre'] = 'null'
    else:
        data['pNombre'] = "'"+data['pNombre']+"'"


    c.callproc("dbms_output.enable")
    c.execute("""
                DECLARE
            l_cursor  SYS_REFCURSOR;
            pTotReg number DEFAULT 100;
            pTotPaginas number DEFAULT 100;
            pPagina number DEFAULT null;
            pLineas number DEFAULT 100;
            pCLiente varchar2(50) DEFAULT null;
            pNombre varchar2(50) DEFAULT null;
            pDireccion varchar2(50) DEFAULT null;
            output number DEFAULT 1000000;
                v_cod_cia varchar2(2);
                v_nombre_cia varchar2(100);
                v_grupo_cliente varchar2(2);
                v_nom_grupo_cliente varchar2(50);
                v_cod_cliente varchar2(50);
                v_nombre_cliente varchar2(200);
                v_direccion_cliente varchar2(250);
                v_docu_identif_cliente varchar2(50);
                v_nombre_encargado varchar2(100);
                v_telefono1 varchar2(50);
                v_telefono2 varchar2(50);
                v_telefono3 varchar2(50);
                v_telefono4 varchar2(50);
                v_email1 varchar2(100);
                v_email2 varchar2(100);
                v_email3 varchar2(100);
                v_email4 varchar2(100);
                v_ind_activo varchar2(1);
                v_tot number;
                v_pagina number;
                v_linea number;
            BEGIN

                    pTotReg  := {pTotReg};
                    pTotPaginas  := {pTotPaginas};
                    pPagina  := {pPagina};
                    pLineas  := {pLineas};
                    pCLiente := {pCLiente};
                    pNombre := {pNombre};
                    pDireccion := {pDireccion};

                dbms_output.enable(output);
                PROCESOSPW.clientes (l_cursor, pTotReg, pTotPaginas, pPagina, pLineas, pCLiente, pNombre, pDireccion);
                
            LOOP 
            FETCH l_cursor into
                v_cod_cia,
                v_nombre_cia,
                v_grupo_cliente,
                v_nom_grupo_cliente,
                v_cod_cliente,
                v_nombre_cliente,
                v_direccion_cliente,
                v_docu_identif_cliente,
                v_nombre_encargado,
                v_telefono1,
                v_telefono2,
                v_telefono3,
                v_telefono4,
                v_email1,
                v_email2,
                v_email3,
                v_email4,
                v_ind_activo,
                v_pagina,
                v_linea;
            dbms_output.put_line
                (
                v_cod_cia|| '|'|| 
                v_nombre_cia|| '|'|| 
                v_grupo_cliente|| '|'|| 
                v_nom_grupo_cliente|| '|'|| 
                v_cod_cliente|| '|'|| 
                v_nombre_cliente|| '|'|| 
                v_direccion_cliente|| '|'|| 
                v_docu_identif_cliente|| '|'|| 
                v_nombre_encargado|| '|'|| 
                v_telefono1|| '|'|| 
                v_telefono2|| '|'|| 
                v_telefono3|| '|'|| 
                v_telefono4|| '|'|| 
                v_email1|| '|'|| 
                v_email2|| '|'|| 
                v_email3|| '|'|| 
                v_email4|| '|'||
                v_ind_activo|| '|'||
                v_pagina|| '|'|| 
                v_linea        
                );
            EXIT WHEN l_cursor%NOTFOUND;
            END LOOP;
            CLOSE l_cursor;
        END;        
            """.format(
                        pTotReg = data['pTotReg'],
                        pTotPaginas = data['pTotPaginas'],
                        pPagina = data['pPagina'],
                        pLineas = data['pLineas'],
                        pDireccion = data['pDireccion'],
                        pCLiente = data['pCLiente'],
                        pNombre = data['pNombre'],
                    ))
    textVar = c.var(str)
    statusVar = c.var(int)
    list = []
    while True:
        c.callproc("dbms_output.get_line", (textVar, statusVar))
        if statusVar.getvalue() != 0:
            break
        arr = str(textVar.getvalue()).split("|")
        obj = {
        'cod_cia' : arr[0],
        'nombre_cia': arr[1],
        'grupo_cliente': arr[2],
        'nom_grupo_cliente': arr[3],
        'cod_cliente': arr[4],
        'nombre_cliente': arr[5],
        'direccion_cliente': arr[6],
        'docu_identif_cliente': arr[7],
        'nombre_encargado': arr[8],
        'telefono1': arr[9],
        'telefono2': arr[10],
        'telefono3': arr[11],
        'telefono4': arr[12],
        'email1': arr[13],
        'email2': arr[14],
        'email3': arr[15],
        'email4': arr[16],
        'ind_activo': arr[17],
        'pagina': arr[18],
        'linea': arr[19]
        }
        list.append(obj)
    return response.json({"msj": "OK", "obj": list}, 200)

@app.route('/procedure_deudas', ["POST", "GET"])
@jwt_required
async def procedure(request , token : Token):
# async def procedure(request):

    data = request.json

    if not 'pTotReg' in data or data['pTotReg'] == 0 :
        data['pTotReg'] = 100

    if not 'pTotPaginas' in data or data['pTotPaginas'] == 0 :
        data['pTotPaginas'] = 100
    
    if not 'pPagina' in data or data['pPagina'] == 0 :
        data['pPagina'] = 1

    if not 'pLineas' in data or data['pLineas'] == 0 :
        data['pLineas'] = 100

    if not 'pDeuda' in data :
        data['pDeuda'] = 'null'

    if not 'pCLiente' in data :
        data['pCLiente'] = 'null'
    else:
        data['pCLiente'] = "'"+data['pCLiente']+"'"
    
    if not 'pNombre' in data :
        data['pNombre'] = 'null'
    else:
        data['pNombre'] = "'"+data['pNombre']+"'"

    if not 'pTipo' in data :
        data['pTipo'] = 'null'
    else:
        data['pTipo'] = "'"+data['pTipo']+"'"

    if not 'pEstatus' in data :
        data['pEstatus'] = 'null'
    else:
        data['pEstatus'] = "'"+data['pEstatus']+"'"
        

    db = get_db()
    c = db.cursor()
    c.callproc("dbms_output.enable")
    c.execute("""
                DECLARE
                l_cursor  SYS_REFCURSOR;
                    pTotReg number DEFAULT 100;
                    pTotPaginas number DEFAULT 100;
                    pPagina number DEFAULT 1;
                    pLineas number DEFAULT 100;
                    pDeuda varchar2(50) DEFAULT null;
                    pCLiente varchar2(50) DEFAULT null;
                    pNombre varchar2(50) DEFAULT null;
                    pTipo varchar2(50) DEFAULT null;
                    pEstatus varchar2(50) DEFAULT null;
                    output number DEFAULT 1000000;
                    v_id_deuda number;
                    v_codigo_cliente varchar2(50);
                    v_nombre_cliente varchar2(50);
                    v_tipo_pago varchar2(50);
                    v_fecha_vencimiento varchar2(50);
                    v_monto_inicial number;
                    v_monto_actual number;
                    v_fecha_ultimo_pago date;
                    v_monto_ultimo_pago number;
                    v_estatus_deuda varchar2(50);
                    v_codigo_tipo_doc number;
                    v_nombre_tipo_doc varchar2(50);
                    v_tot number;
                    v_codigo_compani varchar(10);
                    v_grupo varchar(10);
                    v_pagina number;
                    v_linea number;

                BEGIN

                     pTotReg  := {pTotReg};
                     pTotPaginas  := {pTotPaginas};
                     pPagina  := {pPagina};
                     pLineas  := {pLineas};
                     pDeuda := {pDeuda};
                     pCLiente := {pCLiente};
                     pNombre := {pNombre};
                     pTipo := {pTipo};
                     pEstatus := {pEstatus};

                    dbms_output.enable(output);

                    PROCESOSPW.deudas (l_cursor, pTotReg ,pTotPaginas, pPagina, pLineas, pDeuda , pCLiente , pNombre, pTipo, pEstatus);
                        
                    LOOP 
                    FETCH l_cursor into
                        v_id_deuda,
                        v_codigo_cliente,
                        v_nombre_cliente,
                        v_tipo_pago,
                        v_fecha_vencimiento,
                        v_monto_inicial,
                        v_monto_actual,
                        v_fecha_ultimo_pago,
                        v_monto_ultimo_pago,
                        v_estatus_deuda,
                        v_codigo_tipo_doc,
                        v_nombre_tipo_doc,
                        v_codigo_compani,
                        v_grupo,
                        v_pagina,
                        v_linea;
                    dbms_output.put_line
                        (
                        v_id_deuda|| '|'|| 
                        v_codigo_cliente|| '|'|| 
                        v_nombre_cliente|| '|'|| 
                        v_tipo_pago|| '|'|| 
                        v_fecha_vencimiento|| '|'|| 
                        v_monto_inicial|| '|'|| 
                        v_monto_actual|| '|'|| 
                        v_fecha_ultimo_pago|| '|'|| 
                        v_monto_ultimo_pago|| '|'|| 
                        v_estatus_deuda|| '|'|| 
                        v_codigo_tipo_doc|| '|'|| 
                        v_nombre_tipo_doc|| '|'||
                        v_codigo_compani|| '|'||
                        v_grupo|| '|'||
                        v_pagina|| '|'||
                        v_linea      
                        );
                    EXIT WHEN l_cursor%NOTFOUND;
                    END LOOP;
                CLOSE l_cursor;
                
                END;
        
            """.format(
                        pTotReg = data['pTotReg'],
                        pTotPaginas = data['pTotPaginas'],
                        pPagina = data['pPagina'],
                        pLineas = data['pLineas'],
                        pDeuda = data['pDeuda'],
                        pCLiente = data['pCLiente'],
                        pNombre = data['pNombre'],
                        pTipo = data['pTipo'],
                        pEstatus = data['pEstatus']
                    )
                )

    textVar = c.var(str)
    statusVar = c.var(int)
    list = []
    while True:
        c.callproc("dbms_output.get_line", (textVar, statusVar))
        if statusVar.getvalue() != 0:
            break
        arr = str(textVar.getvalue()).split("|")
        obj = {
            'id_deuda' : arr[0],
            'codigo_cliente' : arr[1],
            'nombre_cliente' : arr[2],
            'tipo_pago' : arr[3],
            'fecha_vencimiento' : arr[4],
            'monto_inicial' : arr[5],
            'monto_actual' : arr[6],
            'fecha_ultimo_pago' : arr[7],
            'monto_ultimo_pago' : arr[8],
            'estatus_deuda' : arr[9],
            'codigo_tipo_doc' : arr[10],
            'nombre_tipo_doc' : arr[11],
            'codigo_compani': arr[12],
            'grupo': arr[13],
            'pagina': arr[14],
            'linea': arr[15] 
        }
        list.append(obj)
    return response.json({"msj":"OK", "obj": list}, 200)

@app.route('/procedure_productos', ["POST", "GET"])
async def procedure(request):

    data = request.json

    print(data)

    if not 'pTotReg' in data or data['pTotReg'] == 0 :
        data['pTotReg'] = 100

    if not 'pTotPaginas' in data or data['pTotPaginas'] == 0 :
        data['pTotPaginas'] = 100
    
    if not 'pPagina' in data or data['pPagina'] == 0 :
        data['pPagina'] = 1

    if not 'pLineas' in data or data['pLineas'] == 0 :
        data['pLineas'] = 100

    if not 'pNoCia' in data :
        data['pNoCia'] = 'null'
    else:
        data['pNoCia'] = "'"+data['pNoCia']+"'"

    if not 'pNoGrupo' in data :
        data['pNoGrupo'] = 'null'
    else:
        data['pNoGrupo'] = "'"+data['pNoGrupo']+"'"
    
    if not 'pCliente' in data :
        data['pCliente'] = 'null'
    else:
        data['pCliente'] = "'"+data['pCliente']+"'"

    if not 'pMoneda' in data :
        data['pMoneda'] = '\'P\''
    else:
        data['pMoneda'] = "'"+data['pMoneda']+"'"

    if not 'pBusqueda' in data :
        data['pBusqueda'] = 'null'
    else:
        data['pBusqueda'] = "'"+data['pBusqueda']+"'"

    if not 'pComponente' in data :
        data['pComponente'] = 'null'
    else:
        data['pComponente'] = "'"+data['pComponente']+"'"

    db = get_db()
    c = db.cursor()
    c.callproc("dbms_output.enable")
    c.execute("""

            DECLARE
            l_cursor  SYS_REFCURSOR;
            pTotReg number DEFAULT 100;
            pTotPaginas number DEFAULT 100;
            pPagina number DEFAULT 1;
            pLineas number DEFAULT 100;
            pNoCia varchar2(10) DEFAULT null;
            pNoGrupo varchar2(10) DEFAULT null;
            pCliente varchar2(50) DEFAULT null;
            pMoneda varchar2(10) DEFAULT 'P';
            pBusqueda varchar2(50) DEFAULT null;
            pComponente varchar2(50) DEFAULT null;

            output number DEFAULT 1000000;
                V_BODEGA                       varchar2(02);
                V_NOMBRE_BODEGA                varchar2(100);
                V_COD_PRODUCTO                 varchar2(15);
                V_NOMBRE_PRODUCTO              varchar2(250);
                V_PRINC_ACTIVO                 varchar2(300);
                V_EXISTENCIA                   number;
                V_EXISTENCIA1                  number;
                V_PRECIO                       number;
                v_tot                          number;
                V_PAGINA                       number;
                V_LINEA                        number;

            BEGIN

                                pTotReg  := {pTotReg};
                                pTotPaginas  := {pTotPaginas};
                                pPagina  := {pPagina};
                                pLineas  := {pLineas};
                                pNoCia := {pNoCia};
                                pNoGrupo := {pNoGrupo};
                                pCliente := {pCliente};
                                pMoneda := {pMoneda};
                                pBusqueda := {pBusqueda};
                                pComponente := {pComponente};

                dbms_output.enable(output);

                PROCESOSPW.productos (l_cursor, pTotReg ,pTotPaginas, pPagina, pLineas, pNoCia, pNoGrupo,pCliente,pMoneda,pBusqueda,pComponente);
                    
            LOOP 
                FETCH l_cursor into
                V_BODEGA,
                V_NOMBRE_BODEGA,
                V_COD_PRODUCTO,
                V_NOMBRE_PRODUCTO,
                V_PRINC_ACTIVO,
                V_EXISTENCIA,
                V_PRECIO,
                V_PAGINA,
                V_LINEA;
                dbms_output.put_line
                (
                    V_BODEGA|| '|'|| 
                    V_NOMBRE_BODEGA|| '|'|| 
                    V_COD_PRODUCTO|| '|'|| 
                    V_NOMBRE_PRODUCTO|| '|'|| 
                    V_PRINC_ACTIVO|| '|'|| 
                    V_EXISTENCIA|| '|'|| 
                    V_PRECIO|| '|'||
                    V_PAGINA|| '|'||
                    V_LINEA      
                );
                EXIT WHEN l_cursor%NOTFOUND;
            END LOOP;
            CLOSE l_cursor;
            
            END;

                """.format(
                        pTotReg = data['pTotReg'],
                        pTotPaginas = data['pTotPaginas'],
                        pPagina = data['pPagina'],
                        pLineas = data['pLineas'],
                        pNoCia = data['pNoCia'],
                        pNoGrupo = data['pNoGrupo'],
                        pCliente = data['pCliente'],
                        pMoneda = data['pMoneda'],
                        pBusqueda = data['pBusqueda'],
                        pComponente = data['pComponente'],
                    ))
    textVar = c.var(str)
    statusVar = c.var(int)
    list = []
    while True:
        c.callproc("dbms_output.get_line", (textVar, statusVar))
        if statusVar.getvalue() != 0:
            break
        arr = str(textVar.getvalue()).split("|")
        obj = {
            'bodega': arr[0],
            'nombre_bodega': arr[1],
            'cod_producto': arr[2],
            'nombre_producto': arr[3],
            'princ_activo': arr[4],
            'existencia': arr[5],
            'precio': arr[6],
            'pagina': arr[7],
            'linea': arr[8]
        }
        list.append(obj)
    return response.json({ "msg":"OK", "obj": list }, 200)

@app.route('/procedure_facturacion', ["POST", "GET"])
async def procedure(request):

    data = request.json
    print(data)
    if not 'pTotReg' in data or data['pTotReg'] == 0 :
        data['pTotReg'] = 100

    if not 'pTotPaginas' in data or data['pTotPaginas'] == 0 :
        data['pTotPaginas'] = 100
    
    if not 'pPagina' in data or data['pPagina'] == 0 :
        data['pPagina'] = 1

    if not 'pLineas' in data or data['pLineas'] == 0 :
        data['pLineas'] = 100

    if not 'pDeuda' in data :
        data['pDeuda'] = 'null'
    else:
        data['pDeuda'] = "'"+data['pDeuda']+"'"

    if not 'pNoCia' in data :
        data['pNoCia'] = 'null'
    else:
        data['pNoCia'] = "'"+data['pNoCia']+"'"

    if not 'pCliente' in data :
        data['pCliente'] = 'null'
    else:
        data['pCliente'] = "'"+data['pCliente']+"'"

    if not 'pNombre' in data :
        data['pNombre'] = 'null'
    else:
        data['pNombre'] = "'"+data['pNombre']+"'"

    if not 'pFechaFactura' in data :
        data['pFechaFactura'] = 'null'

    if not 'pFechaPedido' in data :
        data['pFechaPedido'] = 'null'


    print(data)
    db = get_db()
    c = db.cursor()
    c.callproc("dbms_output.enable")
    c.execute("""

                     DECLARE
                                        l_cursor  SYS_REFCURSOR;
                                        pTotReg number DEFAULT 100;
                                        pTotPaginas number DEFAULT 100;
                                        pPagina number DEFAULT 1;
                                        pLineas number DEFAULT 100;
                                        pDeuda number DEFAULT 1363653;
                                        pCliente varchar2(50) DEFAULT null;
                                        pNombre varchar2(50) DEFAULT null;
                                        output number DEFAULT 1000000;
                                        pFechaFactura date;
                                        pFechaPedido date;
                                        v_id_deuda varchar2(50);
                                        v_fecha_factura date;
                                        v_nro_pedido varchar2(50);
                                        v_fecha_pedido date;
                                        v_cod_vendedor varchar2(50);
                                        v_nombre_vendedor varchar2(150);
                                        v_email_vendedor varchar2(90);
                                        v_no_linea number;
                                        v_no_arti varchar2(50);
                                        v_nombre_arti varchar2(150);
                                        v_unidades_pedido number;
                                        v_unidades_facturadas number;
                                        v_total_producto number;
                                        v_tot number;
                                        v_codigo_compani varchar(10);
                                        v_grupo varchar(10);
                                        v_pagina number;
                                        v_linea number;
                                
                            BEGIN

                                pTotReg  := {pTotReg};
                                pTotPaginas  := {pTotPaginas};
                                pPagina  := {pPagina};
                                pLineas  := {pLineas};
                                pDeuda := {pDeuda};
                                pCliente := {pCliente};
                                pNombre := {pNombre};
                                pFechaFactura := {pFechaFactura};
                                pFechaPedido := {pFechaPedido};


                                dbms_output.enable(output);

                                PROCESOSPW.pedidos_facturados (l_cursor, pTotReg, pTotPaginas, pPagina , pLineas,pDeuda, pCliente, pNombre, pFechaFactura, pFechaPedido);
                                    
                            LOOP 
                                FETCH l_cursor into
                                        v_id_deuda,
                                        v_fecha_factura,
                                        v_nro_pedido,
                                        v_fecha_pedido,
                                        v_cod_vendedor,
                                        v_nombre_vendedor,
                                        v_email_vendedor,
                                        v_no_linea,
                                        v_no_arti,
                                        v_nombre_arti,
                                        v_unidades_pedido,
                                        v_unidades_facturadas,
                                        v_total_producto,
                                        v_tot,
                                        v_codigo_compani,
                                        v_grupo,
                                        v_pagina,
                                        v_linea;
                                dbms_output.put_line
                                (
                                        v_id_deuda|| '|'|| 
                                        v_fecha_factura|| '|'|| 
                                        v_nro_pedido|| '|'|| 
                                        v_fecha_pedido|| '|'|| 
                                        v_cod_vendedor|| '|'|| 
                                        v_nombre_vendedor|| '|'|| 
                                        v_email_vendedor|| '|'|| 
                                        v_no_linea|| '|'|| 
                                        v_no_arti|| '|'|| 
                                        v_nombre_arti|| '|'|| 
                                        v_unidades_pedido|| '|'|| 
                                        v_unidades_facturadas|| '|'|| 
                                        v_total_producto|| '|'||
                                        v_codigo_compani|| '|'||
                                        v_grupo|| '|'||
                                        v_pagina|| '|'||
                                        v_linea     
                                );
                                EXIT WHEN l_cursor%NOTFOUND;
                            END LOOP;
                            CLOSE l_cursor;

                            END;
                """.format(
                        pTotReg = data['pTotReg'],
                        pTotPaginas = data['pTotPaginas'],
                        pPagina = data['pPagina'],
                        pLineas = data['pLineas'],
                        pDeuda = data['pDeuda'],
                        pCliente = data['pCliente'],
                        pNombre = data['pNombre'],
                        pFechaFactura = data['pFechaFactura'],
                        pFechaPedido = data['pFechaPedido']

                        
                    )
                 )
    textVar = c.var(str)
    statusVar = c.var(int)
    list = []
    while True:
        c.callproc("dbms_output.get_line", (textVar, statusVar))
        if statusVar.getvalue() != 0:
            break
        arr = str(textVar.getvalue()).split("|")
        obj = {
            'id_deuda': arr[0],
            'fecha_factura': arr[1],
            'nro_pedido': arr[2],
            'fecha_pedido': arr[3],
            'cod_vendedor': arr[4],
            'nombre_vendedor': arr[5],
            'email_vendedor': arr[6],
            'no_linea': arr[7],
            'no_arti': arr[8],
            'nombre_arti': arr[9],
            'unidades_pedido': arr[10],
            'unidades_facturadas': arr[11],
            'total_producto': arr[12],
            'codigo_compani': arr[13],
            'grupo': arr[14],
            'pagina': arr[15],
            'linea': arr[16] 
            }
        list.append(obj)
    return response.json({"msj": "OK", "obj": list}, 200)


@app.route('/get/clientes', ["POST", "GET"])
@jwt_required
async def transfer(request, token : Token):
    db = get_db()
    c = db.cursor()
    c.execute("""
                    select  no_cia,
                            grupo,
                            no_cliente,
                            nombre,
                            nombre_comercial,
                            direccion,
                            email1,
                            email2,
                            telefono,
                            cedula
                     from paginaweb.arccmc_temp WHERE ROWNUM <= 150
                    """)
    
    list = []
    for row in c:
        aux = {}
        aux = {
            'no_cia' : row[0],
            'grupo' : row[1],
            'no_cliente' : row[2],
            'nombre' : row[3],
            'nombre_comercial' : row[4],
            'direccion' : row[5],
            'email1' : row[6],
            'email2' : row[7],
            'telefono' : row[8],
            'cedula' : row[9]
        }
        list.append(aux)
    # TESTING
    return response.json(list)

@app.route('/get/farmacias', ["POST","GET"])
async def get_farmacias(request):
    try:
        db = get_db()
        c = db.cursor()
        c.execute("""
                    select 
                    NOMBRE, USA_ORDEN, INTERESES, EXCENTO_IMP, LIMITE_CREDI, 
                    F_ULT_PAGO, F_CIERRE, MOTIVO, PLAZO, DESC_PRONTO_PAGO, VENDEDOR, 
                    MTO_COMP, TIPOPRECIO, CLASE, OFERTA, PLAZO, DIA_TRAMITE, DIA_CORTE
                    FROM PAGINAWEB.ARCCMC_TEMP """)
        list=[]
        for row in c:
            aux = {}
            aux = {
                'NOMBRE' : row[0],
                'USA_ORDEN' : row[1],
                'INTERESES' : row[2],
                'EXCENTO_IMP' : row[3],
                'LIMITE_CREDI' : row[4],
                'F_ULT_PAGO' : row[5],
                'F_CIERRE' : row[6],
                'MOTIVO' : row[7],
                'PLAZO' : row[8],
                'DESC_PRONTO_PAGO' : row[9],
                'VENDEDOR':row[10],
                'MTO_COMP':row[11],
                'TIPOPRECIO':row[12],        
                'CLASE':row[13],            
                'OFERTA':row[14],
                'PLAZO':row[15],
                'DIA_TRAMITE':row[16],
                'DIA_CORTE':row[17],            
            }
            list.append(aux)
        return response.json(list)
    except Exception as e:
        logger.debug(traceback.format_exc())
        return response.json("ERROR",400)
        
@app.route('/get/client',["POST","GET"])
async def info_clientes(request):

    data = request.json

    if not 'pCliente' in data:       
        return response.json({"msg": "Missing username parameter"}, status=400)
    
    else:
        data['pCliente'] = "'"+data['pCliente']+"'"

    
    db = get_db()
    c = db.cursor()
    c.execute(""" SELECT NO_CIA, GRUPO, NO_CLIENTE, 
                NOMBRE, NOMBRE_COMERCIAL, DIRECCION, 
                EMAIL1, EMAIL3, TELEFONO, CEDULA, *
                FROM PAGINAWEB.ARCCMC_TEMP WHERE NO_CLIENTE = {pCliente} """.format(
                        pCliente = data['pCliente'],
                        
                    ))
    list = []
    # for row in c:
    #     aux = {}
    #     aux = {
    #         'no_cia':row[0],
    #         'grupo':row[1],
    #         'no_cliente':row[2],
    #         'nombre':row[3],
    #         'nombre_comercial':row[4],
    #         'direccion':row[5],
    #         'email1':row[6],
    #         'email3':row[7],
    #         'telefono':row[8],
    #         'cedula':row[9]
    #     }
    #     list.append(row)
    while True:
                row = c.fetchone()
                if row is None:
                    break
                print(row)
    return response.json(row)  
      
@app.route('/add/pedido',["POST","GET"])
@jwt_required
async def add_pedido (request, token: Token):
# async def procedure(request):
    try:
        data = request.json
        print(data)
        # if not 'COD_PRODUCTO' in data :
        #     return response.json("ERROR",400)
        # if not 'CANTIDAD' in data :
        #     return response.json("ERROR",400)
        # if not 'PRECIO' in data :
        #     return response.json("ERROR",400)
        

        db = get_db()
        c = db.cursor()

        sql = """
                declare
                    s2 number;
                              
                begin
                    
                    INSERT INTO PEDIDO ( COD_CIA, GRUPO_CLIENTE, 
                                            COD_CLIENTE, FECHA, NO_PEDIDO_CODISA, 
                                            OBSERVACIONES, ESTATUS) VALUES 
                            (  :COD_CIA, :GRUPO_CLIENTE, :COD_CLIENTE, :FECHA, :NO_PEDIDO_CODISA, :OBSERVACIONES, :ESTATUS  )
                             returning ID into s2;
                    dbms_output.put_line(s2);
                    IF s2 > 0 THEN
                        DELETE FROM LAST_ID_DETALLE_PEDIDO WHERE ID <> s2;
                        INSERT INTO LAST_ID_DETALLE_PEDIDO (ID) VALUES ( s2 );                        
                    END IF;
                end;
            """

        c.execute(sql, [                        
                        data['COD_CIA'],
                        data['GRUPO_CLIENTE'],
                        data['COD_CLIENTE'],
                        data['FECHA'],
                        data['NO_PEDIDO_CODISA'],
                        data['OBSERVACIONES'],
                        data['ESTATUS']
                    ]
                )
        
        c.execute("""select ID from LAST_ID_DETALLE_PEDIDO""")
        row = c.fetchone()
        ID =row[0]

        # print(data)
        for pedido in data['pedido']:
            print(pedido)
            sql = """INSERT INTO DETALLE_PEDIDO ( ID_PEDIDO, COD_PRODUCTO, CANTIDAD, PRECIO) VALUES ( {ID_PEDIDO}, \'{COD_PRODUCTO}\' ,  {CANTIDAD} ,  {PRECIO}  )"""
            precio =str(pedido['PRECIO']
            c.execute(sql.format(
                ID_PEDIDO = int(ID),
                 COD_PRODUCTO = str(pedido['COD_PRODUCTO']), 
                 CANTIDAD = int(pedido['CANTIDAD']), 
                 PRECIO = float(precio).replace(',','.'))
                    ))

        db.commit()                                                           
        return response.json("SUCCESS",200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)

   
@app.route('/upd/pedido',["POST","GET"])
@jwt_required
async def update_pedido (request, token: Token):
# async def procedure(request):
    try:
        data = request.json
        print(data)
        # if not 'COD_PRODUCTO' in data :
        #     return response.json("ERROR",400)
        # if not 'CANTIDAD' in data :
        #     return response.json("ERROR",400)
        # if not 'PRECIO' in data :
        #     return response.json("ERROR",400)
        

        db = get_db()
        c = db.cursor()

        sql = """
                    UPDATE PAGINAWEB.PEDIDO
                    SET    
                        --COD_CIA          = :COD_CIA,
                        --GRUPO_CLIENTE    = :GRUPO_CLIENTE,
                        --COD_CLIENTE      = :COD_CLIENTE,
                        --FECHA            = :FECHA,
                        --NO_PEDIDO_CODISA = :NO_PEDIDO_CODISA,
                        OBSERVACIONES    = :OBSERVACIONES
                    WHERE  ID               = :ID

            """

        c.execute(sql, [                        
                        # data['COD_CIA'],
                        # data['GRUPO_CLIENTE'],
                        # data['COD_CLIENTE'],
                        # data['FECHA'],
                        # data['NO_PEDIDO_CODISA'],
                        data['OBSERVACIONES'],
                        data['ID']
                    ]
                )
        print("ejecuto primero")
        c.execute("""DELETE FROM DETALLE_PEDIDO WHERE ID_PEDIDO = :ID""",[data['ID']])
        # row = c.fetchone()
        ID = data['ID']
        print("ejecuto segundo")
        print(data)
        for pedido in data['pedido']:
            print(pedido)
            sql = """INSERT INTO DETALLE_PEDIDO ( ID_PEDIDO, COD_PRODUCTO, CANTIDAD, PRECIO) VALUES ( {ID_PEDIDO}, \'{COD_PRODUCTO}\' ,  {CANTIDAD} ,  {PRECIO}  )"""

            c.execute(sql.format(
                ID_PEDIDO = int(ID),
                 COD_PRODUCTO = str(pedido['COD_PRODUCTO']), 
                 CANTIDAD = int(pedido['CANTIDAD']), 
                 PRECIO = float(pedido['PRECIO'].replace(',','.'))
                    ))

        db.commit()                                                           
        return response.json("SUCCESS",200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)

   


@app.route('/get/pedidos',["POST","GET"])
@jwt_required
async def pedidos (request , token: Token):
    try:  
        data = request.json

        if not 'pCliente' in data :
            data['pCliente'] = 'null'
            data['filter'] = '--'
        else:
            data['pCliente'] = "'"+data['pCliente']+"'"
            data['filter'] = ''

        db = get_db()
        c = db.cursor()
        c.execute("""SELECT 
        
                             COD_CIA, GRUPO_CLIENTE, 
                            COD_CLIENTE, FECHA, NO_PEDIDO_CODISA, 
                            OBSERVACIONES,  t2.descripcion, sum(t3.precio)
                                monto, count(t3.COD_PRODUCTO) producto,ID
                            FROM PAGINAWEB.PEDIDO t1 
                            join PAGINAWEB.ESTATUS t2
                                on t1.ESTATUS = t2.CODIGO
                            join PAGINAWEB.DETALLE_PEDIDO t3
                                on t1.ID = t3.ID_PEDIDO
                            {filter} WHERE COD_CLIENTE = {pCliente} 
                             GROUP BY ID, COD_CIA, GRUPO_CLIENTE, 
                                   COD_CLIENTE, FECHA, NO_PEDIDO_CODISA, 
                                   OBSERVACIONES,  t2.descripcion
                                 order by ID desc
                            """.format(filter = data['filter'], pCliente = data['pCliente'] ))
        list = []
        for row in c:
            aux = {}
            aux = {
                    'no_cia':row[0],
                    'grupo':row[1],
                    'no_cliente':row[2],
                    'fecha':row[3],
                    'no_factu':row[4],
                    # 'no_arti':row[4],
                    'observacion':row[5],
                    'estatus':row[6],
                    'precio':row[7],
                    'cantidad':row[8],
                    'ID':row[9],
                    
                    
              }
            list.append(aux)
         
        c.execute("""select count(1) from PEDIDO""")
        row = c.fetchone()
        totalPages=row[0]/100
        if totalPages < 0.5:
            totalPages = totalPages + 0.5
        return response.json({"data":list,
                              "page":'01',
                              "totalPages": round(totalPages)},200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)


@app.route('/get/pedido',["POST","GET"])
@jwt_required
async def pedido (request , token: Token):
    try:  
        data = request.json

        if not 'idPedido' in data or data['idPedido'] == 0 :   
            return response.json({"msg": "Missing ID parameter"}, status=400)

        db = get_db()
        c = db.cursor()

        c.execute("""SELECT 
                         COD_PRODUCTO, CANTIDAD, 
                        PRECIO
                        FROM PAGINAWEB.DETALLE_PEDIDO WHERE ID_PEDIDO = {idPedido} """.format( idPedido = data['idPedido'] ))

        pedidos = []
        for row in c:
            aux = {}
            aux = {
                    'COD_PRODUCTO':row[0],
                    'CANTIDAD':row[1],
                    'PRECIO':row[2],
        
              }
            pedidos.append(aux)

        c.execute(""" 
                              SELECT 
                                 COD_CIA, GRUPO_CLIENTE, 
                                COD_CLIENTE, TO_CHAR(FECHA, 'YYYY-MM-DD'), NO_PEDIDO_CODISA, 
                                OBSERVACIONES, ESTATUS
                                FROM PAGINAWEB.PEDIDO WHERE ID = {idPedido} 
                            """.format( idPedido = data['idPedido'] ))
        list = []
        for row in c:
            aux = {}
            aux = {
                    'no_cia':row[0],
                    'grupo':row[1],
                    'no_cliente':row[2],
                    'fecha':row[3],
                    'no_factu':row[4],
                    'observacion':row[5],
                    'estatus':row[6],
                    'pedido': pedidos,
                    
              }
            list.append(aux)
         
        return response.json({"msj": "OK", "obj": list}, 200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)
        
@app.route('/get/pedidos_filtered',["POST","GET","OPTIONS"])
async def pedidos_filter(request):
    try:  
    
        data = request.json
        db = get_db()
        c = db.cursor()
        
        #c.prepare("""SELECT NO_CIA, GRUPO, NO_CLIENTE, NO_FACTU, NO_ARTI, CANTIDAD, PRECIO, FECHA, OBSERVACION
        #            FROM ARFAPEDW
        #            WHERE NO_CLIENTE = :client""")
        #c.execute(None, {'client':'123'})
        #c.execute("select * from ARFAPEDW_TEST")
        #rows = c.fetchall()
        #list = []
        #for row in rows:
        #    print(row)
        #    list.append(row)
        #statement = "SELECT * FROM ARFAPEDW"
        #c.execute(statement)
        #res = c.fetchall()
        #print(res)
        
        c.prepare("""SELECT NO_CIA, GRUPO, NO_CLIENTE, NO_FACTU, NO_ARTI, CANTIDAD, PRECIO, FECHA, OBSERVACION
                    FROM ARFAPEDW_TEST
                    WHERE NO_CLIENTE = :client""")
        c.execute(None, {'client': data['no_client']})
        print(c)
        list = []
        for row in c:
            print(row)
            aux = {}
            aux = {
                    'no_cia':row[0],
                    'grupo':row[1],
                    'no_cliente':row[2],
                    'no_factu':row[3],
                    'no_arti':row[4],
                    'cantidad':row[5],
                    'precio':row[6],
                    'fecha':row[7],
                    'observacion':row[8],
              }
            list.append(aux)
        return response.json(list)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)

@app.route('/get/productos',["POST","GET"])
async def get_productos(request):
    try:  
        data = request.json
        # print("qlq")
        db = get_db()
        c = db.cursor()
        c.prepare("""SELECT * FROM
                        (SELECT a.* , rownum r__
                        FROM(
                        select arccmc_temp.no_cia, arinlo_temp.bodega, 
                        arinda_temp.grupo, arinda_temp.moneda_preciobase, arccmc_temp.no_cliente
                        from arccmc_temp
                        inner join arinda_temp on arccmc_temp.no_cia = arinda_temp.no_cia
                        inner join arinlo_temp on arccmc_temp.no_cia = arinlo_temp.no_cia
                        where arccmc_temp.no_cia =: min) a 
                        WHERE rownum < ((1 * 100) + 1 ))
                     WHERE r__ >= (((1-1) * 100) + 1)""")
                        
        c.execute(None, {'min':'01'})
        #c.execute("""select arccmc_temp.no_cia, arinlo_temp.bodega, 
        #           arinda_temp.grupo, arinda_temp.moneda_preciobase, arccmc_temp.no_cliente
        #          from arccmc_temp
        #            inner join arinda_temp on arccmc_temp.no_cia = arinda_temp.no_cia
        #            inner join arinlo_temp on arccmc_temp.no_cia = arinlo_temp.no_cia
        #            where arccmc_temp.no_cia = '01'""")
        # print("qlq2")
        list = []
        totalPages=0
        for row in c:
            aux = {}
            # print("qlq3")
            aux = {
                    'no_cia':row[0],
                    'bodega':row[1],
                    'grupo':row[2],
                    'moneda_preciobase':row[3],
                    'no_cliente':row[4],
              }
              
            # print("qlq4")
            list.append(aux)
            # print("qlq5")
            
        c.execute("""select count(1) from arccmc_temp""")
        row = c.fetchone()
        print(row)
        totalPages=row[0]/100
        if totalPages < 0.5:
            totalPages = totalPages + 0.5
        return response.json({"data":list,
                              "pageNumber":'01',
                              "totalPages":totalPages})
    except Exception as e:
        logger.debug(traceback.format_exc())
        return response.json("ERROR",400)

@app.route('/get/deuda', ["POST", "GET"])
@jwt_required
async def get_deuda(request, token : Token):
    try:
        data = request.json
        db = get_db()
        c = db.cursor()
        c.execute("""SELECT * FROM
                    (
                        SELECT a.*, rownum r__
                        FROM
                        ( SELECT ID_DEUDA,
                            CODIGO_CLIENTE,
                            NOMBRE_CLIENTE,
                            TIPO_PAGO,
                            TO_CHAR(FECHA_VENCIMIENTO, 'YYYY-MM-DD'),
                            MONTO_INICIAL,
                            MONTO_ACTUAL,
                            TO_CHAR(FECHA_ULTIMO_PAGO, 'YYYY-MM-DD'),
                            MONTO_ULTIMO_PAGO,
                            ESTATUS_DEUDA,
                            CODIGO_TIPO_DOC,
                            NOMBRE_TIPO_DOC
                          FROM ARCCDEUDAS_WEB) a
                        WHERE rownum < (({page} * 100) + 1 ))
                     WHERE r__ >= ((({page}-1) * 100) + 1)""".format(page=data['page']))
                   
        list = []
        for row in c:
            aux = {}
            aux = { 
                    'id_deuda': row[0],
                    'codigo_cliente':row[1],
                    'nombre_cliente':row[2],
                    'tipo_pago':row[3],
                    'fecha_vencimiento':row[4],
                    'monto_inicial':row[5],
                    'monto_actual':row[6],
                    'monto_pendiente': row[5] + row[6],
                    'fecha_ultimo_pago':row[7],
                    'monto_ultimo_pago':row[8],
                    'estatus_deuda':row[9],
                    'codigo_tipo_doc':row[10],
                    'nombre_tipo_doc':row[11]
              }
            list.append(aux)
         
        c.execute("""select count(1) from ARCCDEUDAS_WEB""")
        row = c.fetchone()
        totalPages=row[0]/100
        if totalPages < 0.5:
            totalPages = totalPages + 0.5
        return response.json({"data":list,
                              "page":'01',
                              "totalPages": round(totalPages)},200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)
    
    

@app.route('/get/saldo', ["POST","GET"])
@jwt_required
async def get_saldo(request, token : Token):
    try:
        data = request.json
        db = get_db()
        c = db.cursor()
        c.execute("""SELECT * FROM
                        (SELECT a.* , rownum r__
                        FROM(
                           SELECT 
                            NO_CIA, BODEGA, CLASE, 
                               CATEGORIA, NO_ARTI, NO_LOTE, 
                               UBICACION, SALDO_UNIDAD, SALDO_CONTABLE, 
                               SALDO_MONTO, SALIDA_PEND, COSTOUNI_LOTE, 
                               TO_CHAR(FECHA_ENTRADA, 'YYYY-MM-DD'), TO_CHAR(FECHA_VENCE, 'YYYY-MM-DD'), TO_CHAR(FECHA_FIN_CUARENTENA, 'YYYY-MM-DD'), 
                               PROCESO_TOMA, EXIST_PREP, COSTO_PREP, 
                               NO_CONTEO, IND_FACTURABLE, RESERV_UN, 
                               PORC_DESC, USUARIO_BLOQUEO, TO_CHAR(FECHA_BLOQUEO, 'YYYY-MM-DD'), 
                               COSTOUNI_REAL, BLOQUEADO_ANT_BLOQUEO_GENERAL, PRECIO_PVP, 
                               COSTOUNI_MOV, USUARIO_ING, TO_CHAR(FECHA_ING, 'YYYY-MM-DD'), 
                               USUARIO_MODIF, TO_CHAR(FECHA_MODIF, 'YYYY-MM-DD')
                            FROM PAGINAWEB.ARINLO_TEMP) a
                        WHERE rownum < (({page} * 100) + 1 ))
                     WHERE r__ >= ((({page}-1) * 100) + 1)""".format(page=data['page']))
        list = []
        for row in c:
            aux = {}
            aux = {
                    'no_cia':row[0],
                    'bodega':row[1],
                    'clase':row[2],
                    'categoria':row[3],
                    'no_arti':row[4],
                    'no_lote':row[5],
                    'ubicacion':row[6],
                    'saldo_unidad':row[7],
                    'saldo_contable':row[8],
                    'saldo_monto':row[9],
                    'salida_pend':row[10],
                    'costouni_lote':row[11],
                    'fecha_entrada':row[12],
                    'fecha_vence':row[13],
                    'fecha_fin_cuarentena':row[14],
                    'proceso_toma':row[15],
                    'exist_prep':row[16],
                    'costo_prep':row[17],
                    'no_conteo':row[18],
                    'ind_facturable':row[19],
                    'reserv_un':row[19],
                    'porc_desc':row[20],
                    'usuario_bloqueo':row[21],
                    'fecha_bloqueo':row[22],
                    'costouni_real':row[23],
                    'bloqueado_ant_bloqueo_general':row[24],
                    'precio_pvp':row[25],
                    'costouni_mov':row[26],
                    'usuario_ing':row[27],
                    'fecha_ing':row[28],
                    'usuario_modif':row[29],
                    'fecha_modif':row[30],
              }
            list.append(aux)
        return response.json({"data":list,
        "page":data['page'],
        "totalPages":'100'},200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)
app.run(host='0.0.0.0', port = port, debug = True)