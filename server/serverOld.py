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
{'username':'canon', 'password': 'canon.admin', 'role': 'user', 'name': 'automercado Plaza', 'COD_CIA': '01','GRUPO_CLIENTE': '01','COD_CLIENTE': 'CANON' },
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
    mongo_uri = "mongodb://127.0.0.1:27017/ddo"
    client = AsyncIOMotorClient(mongo_uri)
    db = client['ddo']
    return db

def get_db():
    dsn_tns = cx_Oracle.makedsn('192.168.168.218', '1521', service_name='DELOESTE')
    # if needed, place an 'r' before any parameter in order to address special characters such as '\'.
    conn = cx_Oracle.connect(user=r'APLPAGWEB', password='4P1P4GWE3', dsn=dsn_tns)
    #conn = cx_Oracle.connect(user=r'paginaweb', password='paginaweb', dsn=dsn_tns)
    # if needed, place an 'r' before any parameter in order to address special characters such as '\'.
    #For example, if your user name contains '\', you'll need to place 'r' before the user name: user=r'User Name'
    return conn

def searchUser(username, password):
    for item in users:
        if item["username"] == username and item["password"] == password:
            return item
    return False

@app.route("/login", ["POST"])
async def login(request):
    data = request.json
    username = data.get("username", None)
    password = data.get("password", None)

    if not username:
        return response.json({"msg": "Missing username parameter"}, status=400)
    if not password:
        return response.json({"msg": "Missing password parameter"}, status=400)

    db = get_mongo_db()

    user = await db.user.find_one({'username' : username}, {'_id' : 0})
    print(user)
    if user:
        if user['password'] == password:
            access_token = await create_access_token(identity=username, app=request.app)
            return response.json({'access_token': access_token, 'user': user}, 200)

    return response.json({"msg": "Bad username or password"}, status=403)

@app.route("/refresh_token", ["POST", "GET"])
async def refresh_token(request):
    refresh_token = await create_refresh_token( identity=str(uuid.uuid4()), app=request.app )
    return response.json({'refresh_token': refresh_token}, status=200)

@app.route('/add/user', ["POST", "GET"])
@jwt_required
async def addUser(request, token : Token):
    user = request.json
    db = get_mongo_db()

    await db.user.insert_one(user)

    return response.json("OK", 200)

@app.route('/get/user', ["POST", "GET"])
@jwt_required
async def listUser(request, token : Token):
    data = request.json
    db = get_mongo_db()

    if not 'pCliente' in data :
        users = await db.user.find({}, {'_id' : 0}).to_list(length=None)
    else:
        users = await db.user.find({'COD_CLIENTE' : data['pCliente']}, {'_id' : 0}).to_list(length=None)

    return response.json(users,200)

@app.route('/available/user', ["POST", "GET"])
@jwt_required
async def availableUser(request, token : Token):
    data = request.json
    db = get_mongo_db()
    # username = data.get("username", None)
    users = await db.user.find_one({'username' : data.get("username", None)}, {'_id' : 0})

    return response.json(users,200)

@app.route('/disponible_cliente', ["POST", "GET"])
async def procedure(request):

    data = request.json

    db = get_db()
    c = db.cursor()




    if not 'pCliente' in data :
        data['pCliente'] = 'null'

    if not 'pNoCia' in data :
        data['pNoCia'] = '01'

    if not 'pNoGrupo' in data :
        data['pNoGrupo'] = '01'


    print(data)

    c.callproc("dbms_output.enable")
    sql = """
                DECLARE

                  vdisp_bs NUMBER;
                  vdisp_usd NUMBER;
                  pNoCia varchar2(10) DEFAULT '01';
                  pNoGrupo varchar2(10) DEFAULT '01';
                  pCliente varchar2(50) DEFAULT null;

                BEGIN

                    PROCESOSPW.disponible_cliente(vdisp_bs, vdisp_usd, :pNoCia, :pNoGrupo, :pCliente);

                    dbms_output.put_line(vdisp_bs|| '|'||vdisp_usd);
                END;
            """
    c.execute(sql, [data['pNoCia'],data['pNoGrupo'],data['pCliente']])
    textVar = c.var(str)
    statusVar = c.var(int)
    obj = {}
    while True:
        c.callproc("dbms_output.get_line", (textVar, statusVar))
        if textVar.getvalue() == None:
            break
        print("==========================================================")
        print(textVar.getvalue())
        arr = str(textVar.getvalue()).split("|")
        obj = {
        'disp_bs' : arr[0],
        'disp_usd': arr[1]
        }
        if statusVar.getvalue() != 0:
            break


    return response.json({"msj": "OK", "obj": obj}, 200)

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

    if not 'pCliente' in data :
        data['pCliente'] = 'null'
    else:
        data['pCliente'] = "'"+data['pCliente']+"'"

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
            pCliente varchar2(50) DEFAULT null;
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
                v_plazo varchar2(100);
                v_persona_cyc varchar2(100);
                v_tot number;
                v_pagina number;
                v_linea number;
            BEGIN

                    pTotReg  := {pTotReg};
                    pTotPaginas  := {pTotPaginas};
                    pPagina  := {pPagina};
                    pLineas  := {pLineas};
                    pCliente := {pCliente};
                    pNombre := {pNombre};
                    pDireccion := {pDireccion};

                dbms_output.enable(output);
                PROCESOSPW.clientes (l_cursor, pTotReg, pTotPaginas, pPagina, pLineas, pCliente, pNombre, pDireccion);

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
                v_plazo,
                v_persona_cyc,
                v_pagina,
                v_linea;
                EXIT WHEN l_cursor%NOTFOUND;
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
                v_plazo|| '|'||
                v_persona_cyc|| '|'||
                v_pagina|| '|'||
                v_linea
                );
            END LOOP;
            CLOSE l_cursor;
        END;
            """.format(
                        pTotReg = data['pTotReg'],
                        pTotPaginas = data['pTotPaginas'],
                        pPagina = data['pPagina'],
                        pLineas = data['pLineas'],
                        pDireccion = data['pDireccion'],
                        pCliente = data['pCliente'],
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
        'v_plazo': arr[17],
        'v_persona_cyc': arr[18],
        'pagina': arr[19],
        'linea': arr[20]
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
                        EXIT WHEN l_cursor%NOTFOUND;
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
        data['pNoCia'] = '01'
    else:
        data['pNoCia'] = "'"+data['pNoCia']+"'"

    if not 'pNoGrupo' in data :
        data['pNoGrupo'] = '01'
    else:
        data['pNoGrupo'] = "'"+data['pNoGrupo']+"'"

    if not 'pCliente' in data :
        data['pCliente'] = 'null'
    else:
        data['pCliente'] = "'"+data['pCliente']+"'"

    if not 'pBusqueda' in data :
        data['pBusqueda'] = 'null'
    else:
        data['pBusqueda'] = "'"+data['pBusqueda']+"'"

    if not 'pComponente' in data :
        data['pComponente'] = 'null'
    else:
        data['pComponente'] = "'"+data['pComponente']+"'"
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
            pNoCia varchar2(10) DEFAULT '01';
            pNoGrupo varchar2(10) DEFAULT '01';
            pCliente varchar2(50) DEFAULT null;
            pBusqueda varchar2(50) DEFAULT null;
            pComponente varchar2(50) DEFAULT null;

            output number DEFAULT 1000000;

                v_cod_producto varchar2(100);
                v_nombre_producto varchar2(100);
                v_princ_activo varchar2(100);
                v_ind_regulado varchar2(100);
                v_ind_impuesto varchar2(100);
                v_ind_psicotropico varchar2(100);
                v_fecha_vence varchar2(100);
                v_existencia number;
                v_precio_bruto_bs number;
                v_precio_neto_bs number;
                v_iva_bs number;
                v_precio_usd number;
                v_iva_usd number;
                v_tipo_cambio number;
                v_proveedor varchar2(100);
                v_bodega varchar2(2);
                V_PAGINA number;
                V_LINEA number;
            BEGIN

                                pTotReg  := {pTotReg};
                                pTotPaginas  := {pTotPaginas};
                                pPagina  := {pPagina};
                                pLineas  := {pLineas};
                                pNoCia := {pNoCia};
                                pNoGrupo := {pNoGrupo};
                                pCliente := {pCliente};
                                pBusqueda := {pBusqueda};
                                pComponente := {pComponente};

                dbms_output.enable(output);

                PROCESOSPW.productos (l_cursor, pTotReg ,pTotPaginas, pPagina, pLineas, pNoCia, pNoGrupo,pCliente,pBusqueda,pComponente);

            LOOP
                FETCH l_cursor into
                v_cod_producto,
                v_nombre_producto,
                v_princ_activo,
                v_ind_regulado,
                v_ind_impuesto,
                v_ind_psicotropico,
                v_fecha_vence,
                v_existencia,
                v_precio_bruto_bs,
                v_precio_neto_bs,
                v_iva_bs,
                v_precio_usd,
                v_iva_usd,
                v_tipo_cambio,
                v_proveedor,
                v_bodega,
                V_PAGINA,
                V_LINEA;
                EXIT WHEN l_cursor%NOTFOUND;
                dbms_output.put_line
                (
                    v_cod_producto|| '|'||
                    v_nombre_producto|| '|'||
                    v_princ_activo|| '|'||
                    v_ind_regulado|| '|'||
                    v_ind_impuesto|| '|'||
                    v_ind_psicotropico|| '|'||
                    v_fecha_vence|| '|'||
                    v_existencia|| '|'||
                    v_precio_bruto_bs|| '|'||
                    v_precio_neto_bs|| '|'||
                    v_iva_bs|| '|'||
                    v_precio_usd|| '|'||
                    v_iva_usd|| '|'||
                    v_tipo_cambio|| '|'||
                    v_proveedor|| '|'||
                    v_bodega|| '|'||
                    V_PAGINA|| '|'||
                    V_LINEA
                );
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
            'cod_producto' : arr[0],
            'nombre_producto' : arr[1],
            'princ_activo' : arr[2],
            'ind_regulado' : arr[3],
            'ind_impuesto' : arr[4],
            'ind_psicotropico' : arr[5],
            'fecha_vence' : arr[6],
            'existencia' : arr[7],
            'precio_bruto_bs' : arr[8],
            'precio_neto_bs' : arr[9],
            'iva_bs' : arr[10],
            'precio_neto_usd' : arr[11],
            'iva_usd' : arr[12],
            'tipo_cambio' : arr[13],
            'proveedor' :arr[14],
            'bodega' :arr[15],
            'pagina': arr[16],
            'linea': arr[17]
        }
        list.append(obj)
    return response.json({ "msg":"OK", "obj": list }, 200)

def agrupar_facturas(arreglo):

        list = {}
        for row in arreglo:
            if not row["nro_pedido"] in list :
                list[int(row["nro_pedido"])]=[]

        for row in arreglo:
            list[int(row["nro_pedido"])].append(row)

        return list

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
    c.execute("""DECLARE



      l_cursor  SYS_REFCURSOR;

                pTotReg number DEFAULT 100;
                pTotPaginas number DEFAULT 100;
                pPagina number DEFAULT 1;
                pLineas number DEFAULT 100;
                pDeuda number DEFAULT null;
                pCliente varchar2(50) DEFAULT null;
                pPedido varchar2(50) DEFAULT null;
                output number DEFAULT 1000000;
                pFechaFactura date;
                pFechaPedido date;

                v_id_deuda varchar2(50);

                v_fecha_factura date;

                v_nro_pedido varchar2(50);

                v_fecha_pedido date;

                v_cod_cliente varchar2(50);

                v_cod_vendedor varchar2(50);

                v_nombre_vendedor varchar2(150);

                v_email_vendedor varchar2(90);

                v_no_linea number;

                v_no_arti varchar2(50);

                v_nombre_arti varchar2(150);

                v_unidades_pedido number;

                v_unidades_facturadas number;

                v_total_producto number;

                v_cia        varchar2(2);

                v_grupo      varchar2(2);

                v_pag        number;

                v_lin        number;

                v_totreg     number;

                v_totpag     number;

                v_tot number:=0;





    BEGIN

              pTotReg  := {pTotReg};
              pTotPaginas  := {pTotPaginas};
              pPagina  := {pPagina};
              pLineas  := {pLineas};
              pDeuda := {pDeuda};
              pCliente := {pCliente};
              pFechaFactura := {pFechaFactura};
              pFechaPedido := {pFechaPedido};



         procesospw.pedidos_facturados (l_cursor,pTotReg ,pTotPaginas,pPagina,pLineas,pDeuda, pPedido,pCliente,pFechaFactura,pFechaPedido);





      LOOP

        FETCH l_cursor into

                v_id_deuda,

                v_fecha_factura,

                v_nro_pedido,

                v_fecha_pedido,

                v_cod_cliente,

                v_cod_vendedor,

                v_nombre_vendedor,

                v_email_vendedor,

                v_no_linea,

                v_no_arti,

                v_nombre_arti,

                v_unidades_pedido,

                v_unidades_facturadas,

                v_total_producto,

                v_cia,

                v_grupo,

                v_pag,

                v_lin;

        EXIT WHEN l_cursor%NOTFOUND;

        dbms_output.put_line

          (

                v_id_deuda|| '|'||

                v_fecha_factura|| '|'||

                v_nro_pedido|| '|'||

                v_fecha_pedido|| '|'||

                v_cod_cliente || '|'||

                v_cod_vendedor|| '|'||

                v_nombre_vendedor|| '|'||

                v_email_vendedor|| '|'||

                v_no_linea|| '|'||

                v_no_arti|| '|'||

                v_nombre_arti|| '|'||

                v_unidades_pedido|| '|'||

                v_unidades_facturadas|| '|'||

                v_total_producto || '|'||

                v_cia || '|'||

                v_grupo || '|'||

                v_pag|| '|'||

                v_lin

          );



      END LOOP;

         --v_tot:=l_cursor%rowcount;

         --dbms_output.put_line(v_tot || '|'|| v_totreg || '|'|| v_totpag );

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
                'cod_cliente': arr[4],
                'cod_vendedor': arr[5],
                'nombre_vendedor': arr[6],
                'email_vendedor': arr[7],
                'no_linea': arr[8],
                'no_arti': arr[9],
                'nombre_arti': arr[10],
                'unidades_pedido': arr[11],
                'unidades_facturadas': arr[12],
                'total_producto': arr[13],
                'codigo_compani': arr[14],
                'grupo': arr[15],
                'pagina': arr[16],
                'linea': arr[17]
            }
        list.append(obj)

    return response.json({"msj": "OK", "obj": agrupar_facturas(list)}, 200)

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

@app.route('/valida/client', ["POST", "GET"])
@jwt_required
async def valida_client(request, token : Token):
    try:
        data = request.json

        if not 'pNoCia' in data :
            data['pNoCia'] = '01'
        # else:
        #     data['pNoCia'] = "'"+data['pNoCia']+"'"

        if not 'pNoGrupo' in data :
            data['pNoGrupo'] = '01'
        # else:
        #     data['pNoGrupo'] = "'"+data['pNoGrupo']+"'"

        if not 'pCliente' in data :
            data['pCliente'] = 'null'
        # else:
        #     data['pCliente'] = "'"+data['pCliente']+"'"

        if not 'pMoneda' in data :
                data['pMoneda'] = '\'P\''
        # else:
        #     data['pMoneda'] = "'"+data['pMoneda']+"'"

        db = get_db()
        c = db.cursor()
        sql = """select
                    t2.DESCRIPCION
                        from dual
                    join TIPO_ERROR t2 on procesospw.valida_cliente(:pNoCia,:pNoGrupo,:pCliente,:pMoneda,0) = t2.CODIGO"""
        c.execute(sql, [
                        data['pNoCia'],
                        data['pNoGrupo'],
                        data['pCliente'],
                        data['pMoneda']
                    ])
        row = c.fetchone()

        # totalPages=row[0]

        return response.json({"data":row},200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)

async def crear_pedido(request):
    try:
        data = request.json

        db = get_db()
        c = db.cursor()
        c.callproc("dbms_output.enable")
        sql = """
                declare
                    s2 number;

                begin

                    INSERT INTO PEDIDO ( COD_CIA, GRUPO_CLIENTE,
                                            COD_CLIENTE,  NO_PEDIDO_CODISA,
                                            OBSERVACIONES, ESTATUS) VALUES
                            (  :COD_CIA, :GRUPO_CLIENTE, :COD_CLIENTE, :NO_PEDIDO_CODISA, :OBSERVACIONES, :ESTATUS  )
                             returning ID into s2;
                    dbms_output.put_line(s2);
                end;
            """

        c.execute(sql, [
                        data['COD_CIA'],
                        data['GRUPO_CLIENTE'],
                        data['COD_CLIENTE'],
                        data['NO_PEDIDO_CODISA'],
                        data['OBSERVACIONES'],
                        0
                    ]
                )
        print("========================================================================")
        print("ejecuto el query")
        statusVar = c.var(cx_Oracle.NUMBER)
        lineVar = c.var(cx_Oracle.STRING)
        ID = None
        while True:
          c.callproc("dbms_output.get_line", (lineVar, statusVar))
          if lineVar.getvalue() == None:
              break
          print("==========================================================")
          print(lineVar.getvalue())
          ID = lineVar.getvalue()

          if statusVar.getvalue() != 0:
            break
        db.commit()
        return ID
    except Exception as e:
        logger.debug(e)

async def crear_detalle_pedido(detalle, ID):

        try:
            db = get_db()
            c = db.cursor()

            sql = """INSERT INTO DETALLE_PEDIDO ( ID_PEDIDO, COD_PRODUCTO, CANTIDAD, PRECIO_BRUTO, TIPO_CAMBIO, BODEGA)
                            VALUES ( {ID_PEDIDO}, \'{COD_PRODUCTO}\' ,  {CANTIDAD} ,  {PRECIO} , {TIPO_CAMBIO}, \'{BODEGA}\' )"""

            c.execute(sql.format(
                         ID_PEDIDO = int(ID),
                         COD_PRODUCTO = str(detalle['COD_PRODUCTO']),
                         CANTIDAD = int(detalle['CANTIDAD']),
                         PRECIO = float(str(detalle['PRECIO']).replace(',','.')),
                         TIPO_CAMBIO = float(str(detalle['tipo_cambio']).replace(',','.')) ,
                         BODEGA = detalle['bodega']
                    ))

            db.commit()

            await upd_estatus_pedido(1,int(ID))

            # return {
            #             'COD_PRODUCTO':detalle['COD_PRODUCTO'],
            #             'iva_bs':detalle['iva_bs'],
            #             'iva_usd':detalle['iva_usd'],
            #             'precio_usd':detalle['precio_neto_usd'],
            #             'nombre_producto':detalle['nombre_producto']
            #         }

        except Exception as e:
            logger.debug(e)

async def upd_estatus_pedido(estatus, ID):

        db = get_db()
        c = db.cursor()

        sql = """
                    UPDATE PAGINAWEB.PEDIDO
                    SET
                        ESTATUS          = :ESTATUS
                    WHERE  ID               = :ID

            """

        c.execute(sql, [
                        estatus,
                        ID
                    ]
                )

        db.commit()

        return

async def valida_art(cia, arti):
    try:
        db = get_db()
        c = db.cursor()
        sql = """select procesospw.existencia_disponible(:pNoCia,:pArti)
                        from dual"""
        c.execute(sql, [
                        cia,
                        arti
                    ])
        row = c.fetchone()
        return row[0]
    except Exception as e:
        logger.debug(e)

@app.route('/valida/articulo', ["POST", "GET"])
@jwt_required
async def valida_articulo(request, token : Token):
    try:
        data = request.json

        if not 'pNoCia' in data :
            data['pNoCia'] = '01'

        if not 'pArti' in data :
            data['pArti'] = 'null'

        row = await valida_art(data['pNoCia'], data['pArti'])

        print(row)

        return response.json({"data":row},200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)

@app.route('/finalizar_pedido', ["POST", "GET"])
@jwt_required
async def finaliza_pedido(request, token : Token):
    try:
        data = request.json

        await upd_estatus_pedido(2,data['ID'])

        return response.json("success",200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)


@app.route('/add/pedido',["POST","GET"])
@jwt_required
async def add_pedido (request, token: Token):
# async def procedure(request):
    try:
        data = request.json

        ID = await crear_pedido(request)

        iva_list = []

        for pedido in data['pedido']:

            row = await crear_detalle_pedido(pedido, ID)
            iva_list.append(row)


        mongodb = get_mongo_db()
        totales = dict(
            id_pedido = int(ID),
            productos = iva_list
        )

        await mongodb.order.insert_one(totales)

        return response.json("SUCCESS",200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)

@app.route('/add/pedidoV2',["POST","GET"])
@jwt_required
async def add_pedidoV2 (request, token: Token):
# async def procedure(request):
    try:
        data = request.json

        ID = await crear_pedido(request)

        mongodb = get_mongo_db()

        totales = dict(
            id_pedido = int(ID),
            productos = []
        )
        await mongodb.order.insert_one(totales)

        return response.json({"ID":ID},200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)

@app.route('/add/detalle_producto',["POST","GET"])
@jwt_required
async def add_detalle_producto (request, token: Token):
# async def procedure(request):
    try:
        data = request.json

        await crear_detalle_pedido(data['pedido'], data['ID'])

        valid = await valida_art("01", data['pedido']['COD_PRODUCTO'])

        # mongodb = get_mongo_db()
        # await mongodb.order.update({'id_pedido':int(data['ID'])},{"$addToSet":{"productos":row }}, True, True)


        msg = 0

        if data['pedido']['CANTIDAD'] > valid:
            msg = 1

        return response.json({"msg": msg, "reserved":valid },200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)

@app.route('/del/detalle_producto',["POST","GET"])
@jwt_required
async def del_detalle_producto (request, token: Token):
# async def procedure(request):
    try:
        data = request.json

        db = get_db()
        c = db.cursor()

        c.execute("""DELETE FROM DETALLE_PEDIDO WHERE ID_PEDIDO = :ID AND COD_PRODUCTO = :COD_PRODUCTO""",
            [
                data['id_pedido'],
                data['COD_PRODUCTO']
            ])
        db.commit()

        mongodb = get_mongo_db()

        await mongodb.order.update({'id_pedido':int(data['id_pedido'])},{
                                                            "$pull":{
                                                                        "productos":{"COD_PRODUCTO":data['COD_PRODUCTO'] }
                                                                    }
                                                                }, True, True)

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
        iva_list = []
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
            iva_list.append({ 'COD_PRODUCTO':pedido['COD_PRODUCTO'],'iva_bs':pedido['iva_bs'], 'iva_usd':pedido['iva_usd'], 'precio_usd':pedido['precio_usd'],'nombre_producto':pedido['nombre_producto'] })

        db.commit()

        mongodb = get_mongo_db()

        await mongodb.order.update({'id_pedido':int(ID)},{"$set":{"productos":iva_list }}, True, True)

        return response.json("SUCCESS",200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)

@app.route('/del/pedido',["POST","GET"])
@jwt_required
async def update_pedido (request, token: Token):
# async def procedure(request):
    try:
        data = request.json
        print(data)

        db = get_db()
        c = db.cursor()

        c.execute("""DELETE FROM DETALLE_PEDIDO WHERE ID_PEDIDO = :ID""",[data['ID']])

        c.execute("""DELETE FROM PEDIDO WHERE ID = :ID""",[data['ID']])

        db.commit()

        mongodb = get_mongo_db()
        await mongodb.order.remove({'id_pedido':int(data['ID'])})

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
        c.execute("""SELECT COD_CIA, GRUPO_CLIENTE,
                            COD_CLIENTE, TO_CHAR(FECHA_CARGA, 'DD-MM-YYYY'), NO_PEDIDO_CODISA,
                            OBSERVACIONES,  t2.descripcion, (sum(t3.PRECIO_BRUTO * t3.CANTIDAD ))
                                monto, count(t3.COD_PRODUCTO) producto,ID, t1.ESTATUS
                            FROM PAGINAWEB.PEDIDO t1
                            join PAGINAWEB.ESTATUS t2
                                on t1.ESTATUS = t2.CODIGO
                            left join PAGINAWEB.DETALLE_PEDIDO t3
                                on t1.ID = t3.ID_PEDIDO
                            {filter} WHERE COD_CLIENTE = {pCliente}
                             GROUP BY ID, COD_CIA, GRUPO_CLIENTE,
                                   COD_CLIENTE, FECHA_CARGA, NO_PEDIDO_CODISA,
                                   OBSERVACIONES,  t2.descripcion,  t1.ESTATUS
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
                    'estatus_id':row[10]


              }
            list.append(aux)

        c.execute("""select count(1) from PEDIDO""")
        row = c.fetchone()
        totalPages=row[0]/100
        if totalPages < 0.5:
            totalPages = totalPages + 0.5

        print("=====================================================================")
        print(list)
        print("=====================================================================")
        return response.json({"data":list,
                              "page":'01',
                              "totalPages": round(totalPages)},200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)

async def procedure_detalle_pedidos(idPedido):
    try:

        db = get_db()
        c = db.cursor()
        c.callproc("dbms_output.enable")
        c.execute("""DECLARE

                        l_cursor  SYS_REFCURSOR;

                        v_id_pedido number;
                        v_cod_producto varchar2(15);
                        v_nombre_producto varchar2(80);
                        v_princ_activo varchar2(200);
                        v_unidades NUMBER;
                        v_precio_neto_bs number;
                        v_iva_bs number;
                        v_precio_neto_usd number;
                        v_iva_usd number;


                      BEGIN


                          Procesospw.detalle_pedidos_cargados (l_cursor ,{idPedido});


                        LOOP

                          FETCH l_cursor into

                                  v_id_pedido ,
                                  v_cod_producto ,
                                  v_nombre_producto ,
                                  v_princ_activo ,
                                  v_unidades ,
                                  v_precio_neto_bs ,
                                  v_iva_bs ,
                                  v_precio_neto_usd ,
                                  v_iva_usd;

                          EXIT WHEN l_cursor%NOTFOUND;

                          dbms_output.put_line

                            (


                                  v_id_pedido|| '|'||
                                  v_cod_producto|| '|'||
                                  v_nombre_producto|| '|'||
                                  v_princ_activo|| '|'||
                                  v_unidades|| '|'||
                                  v_precio_neto_bs|| '|'||
                                  v_iva_bs|| '|'||
                                  v_precio_neto_usd|| '|'||
                                  v_iva_usd


                            );



                        END LOOP;


                        CLOSE l_cursor;


  END;""".format(idPedido = idPedido))
        textVar = c.var(str)
        statusVar = c.var(int)
        list = []
        while True:
            c.callproc("dbms_output.get_line", (textVar, statusVar))
            if statusVar.getvalue() != 0:
                break
            arr = str(textVar.getvalue()).split("|")
            obj = {
                  'id_pedido': arr[0],
                  'COD_PRODUCTO': arr[1],
                  'nombre_producto': arr[2],
                  'princ_activo': arr[3],
                  'CANTIDAD': arr[4],
                  'precio_neto_bs': arr[5],
                  'PRECIO': arr[5],
                  'iva_bs': arr[6],
                  'precio_neto_usd': arr[7],
                  'iva_usd': arr[8]
            }
            list.append(obj)

        return list
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)

async def procedure_pedidos(idPedido):
    try:

        db = get_db()
        c = db.cursor()
        c.callproc("dbms_output.enable")
        c.execute("""DECLARE

                        l_cursor  SYS_REFCURSOR;

                        v_id_pedido number;
                        v_cod_producto varchar2(15);
                        v_nombre_producto varchar2(80);
                        v_princ_activo varchar2(200);
                        v_unidades NUMBER;
                        v_precio_neto_bs number;
                        v_iva_bs number;
                        v_precio_neto_usd number;
                        v_iva_usd number;


                      BEGIN


                          Procesospw.pedidos_cargados (l_cursor ,174);


                        LOOP

                          FETCH l_cursor into

                                  v_id_pedido ,
                                  v_cod_producto ,
                                  v_nombre_producto ,
                                  v_princ_activo ,
                                  v_unidades ,
                                  v_precio_neto_bs ,
                                  v_iva_bs ,
                                  v_precio_neto_usd ,
                                  v_iva_usd;

                          EXIT WHEN l_cursor%NOTFOUND;

                          dbms_output.put_line

                            (


                                  v_id_pedido|| '|'||
                                  v_cod_producto|| '|'||
                                  v_nombre_producto|| '|'||
                                  v_princ_activo|| '|'||
                                  v_unidades|| '|'||
                                  v_precio_neto_bs|| '|'||
                                  v_iva_bs|| '|'||
                                  v_precio_neto_usd|| '|'||
                                  v_iva_usd


                            );



                        END LOOP;


                        CLOSE l_cursor;


  END;""".format(idPedido = idPedido))
        textVar = c.var(str)
        statusVar = c.var(int)
        list = []
        while True:
            c.callproc("dbms_output.get_line", (textVar, statusVar))
            if statusVar.getvalue() != 0:
                break
            arr = str(textVar.getvalue()).split("|")
            obj = {
                  'id_pedido': arr[0],
                  'COD_PRODUCTO': arr[1],
                  'nombre_producto': arr[2],
                  'princ_activo': arr[3],
                  'CANTIDAD': arr[4],
                  'precio_neto_bs': arr[5],
                  'PRECIO': arr[5],
                  'iva_bs': arr[6],
                  'precio_neto_usd': arr[7],
                  'iva_usd': arr[8]
            }
            list.append(obj)

        return list
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

        mongodb = get_mongo_db()

        # totales = await mongodb.order.find_one({'id_pedido' :int(data['idPedido'])}, {'_id' : 0})

        db = get_db()
        c = db.cursor()
        #
        # c.execute("""SELECT
        #                  COD_PRODUCTO, CANTIDAD,
        #                 PRECIO_BRUTO, TIPO_CAMBIO, BODEGA
        #                 FROM PAGINAWEB.DETALLE_PEDIDO WHERE ID_PEDIDO = {idPedido} """.format( idPedido = data['idPedido'] ))
        #
        # pedidos = []
        # for row in c:
        #     aux = {}
        #     aux = {
        #             'COD_PRODUCTO':row[0],
        #             'CANTIDAD':row[1],
        #             'PRECIO':row[2],
        #             'TIPO_CAMBIO':row[3],
        #             'BODEGA':row[4],
        #
        #       }
        #     pedidos.append(aux)

        pedidos = await procedure_detalle_pedidos(int(data['idPedido']))

        c.execute("""SELECT
                         COD_CIA, GRUPO_CLIENTE,
                        COD_CLIENTE, TO_CHAR(FECHA_CARGA, 'DD-MM-YYYY'), NO_PEDIDO_CODISA,
                        OBSERVACIONES, t2.descripcion, ESTATUS
                        FROM PAGINAWEB.PEDIDO t1
                        join PAGINAWEB.ESTATUS t2
                            on t1.ESTATUS = t2.CODIGO
                        WHERE ID = {idPedido}
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
                    'estatus_id':row[6],
                    'pedido': pedidos,
                    # 'totales':totales,
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
