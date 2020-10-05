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

@app.route('/get/users', ["POST", "GET"])
@jwt_required
async def listUser(request, token : Token):
    data = request.json
    db = get_mongo_db()

    if not 'pCliente' in data :
        users = await db.user.find({}, {'_id' : 0}).to_list(length=None)
    else:
        users = await db.user.find({'COD_CLIENTE' : data['pCliente']}, {'_id' : 0}).to_list(length=None)

    return response.json(users,200)

@app.route('/get/user', ["POST", "GET"])
@jwt_required
async def availableUser(request, token : Token):
    data = request.json
    db = get_mongo_db()
    # username = data.get("username", None)
    users = await db.user.find_one({'username' : data.get("username", None)}, {'_id' : 0})

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
        return response.json({"msg": "Missing parameter"}, status=400)

    if not 'pNoGrupo' in data :
        return response.json({"msg": "Missing username parameter"}, status=400)


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

    if not 'pNombre' in data :
        data['pNombre'] = 'null'
    else:
        data['pNombre'] = "'"+data['pNombre']+"'"

    print(data)
    c.callproc("dbms_output.enable")
    c.execute("""
                DECLARE
            l_cursor  SYS_REFCURSOR;
            pTotReg number DEFAULT 100;
            pTotPaginas number DEFAULT 100;
            pPagina number DEFAULT null;
            pLineas number DEFAULT 100;
            pCliente varchar2(50) DEFAULT null;
            pNoCia varchar2(10) DEFAULT null;
            pNoGrupo varchar2(10) DEFAULT null;
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
                v_zona varchar2(25);
                v_monto_minimo number;
                v_tipo_venta varchar2(100);
                v_limite_credito number;
                v_vendedor varchar2(100);
                v_max_unid_med_emp number;
                v_max_unid_misc_emp number;
                v_unid_fact_med_emp number;
                v_unid_fact_misc_emp number;
                v_unid_disp_med_emp number;
                v_unid_disp_misc_emp number;
                v_monto_min_pick number;
                v_tot number;
                v_pagina number;
                v_linea number;
            BEGIN

                    pTotReg  := {pTotReg};
                    pTotPaginas  := {pTotPaginas};
                    pPagina  := {pPagina};
                    pLineas  := {pLineas};
                    pNoCia := {pNoCia};
                    pNoGrupo := {pNoGrupo};
                    pCliente := {pCliente};
                    pNombre := {pNombre};
                    pDireccion := {pDireccion};

                dbms_output.enable(output);
                PROCESOSPW.clientes (l_cursor, pTotReg, pTotPaginas, pPagina, pLineas, pNoCia, pNoGrupo, pCliente, pNombre, pDireccion);

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
                v_zona,
                v_monto_minimo,
                v_tipo_venta,
                v_limite_credito,
                v_vendedor,
                v_max_unid_med_emp,
                v_max_unid_misc_emp,
                v_unid_fact_med_emp,
                v_unid_fact_misc_emp,
                v_unid_disp_med_emp,
                v_unid_disp_misc_emp,
                v_monto_min_pick,
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
                v_zona|| '|'||
                v_monto_minimo|| '|'||
                v_tipo_venta|| '|'||
                v_limite_credito|| '|'||
                v_vendedor|| '|'||
                v_max_unid_med_emp|| '|'||
                v_max_unid_misc_emp|| '|'||
                v_unid_fact_med_emp|| '|'||
                v_unid_fact_misc_emp|| '|'||
                v_unid_disp_med_emp|| '|'||
                v_unid_disp_misc_emp|| '|'||
                v_monto_min_pick|| '|'||
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
                        pNoCia = data['pNoCia'],
                        pNoGrupo = data['pNoGrupo'],
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
        'zona': arr[19],
        'monto_minimo':arr[20],
        'tipo_venta':arr[21],
        'limite_credito':arr[22],
        'vendedor':arr[23],
        'max_unid_med_emp' :arr[24],
        'max_unid_misc_emp' :arr[25],
        'unid_fact_med_emp' :arr[26],
        'unid_fact_misc_emp' :arr[27],
        'unid_disp_med_emp' :arr[28],
        'unid_disp_misc_emp' :arr[29],
        'monto_min_pick' :arr[30],
        'pagina': arr[31],
        'linea': arr[32]
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

    if not 'pNoCia' in data :
        data['pNoCia'] = '01'
    else:
        data['pNoCia'] = "'"+data['pNoCia']+"'"

    if not 'pNoGrupo' in data :
        data['pNoGrupo'] = '01'
    else:
        data['pNoGrupo'] = "'"+data['pNoGrupo']+"'"

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
    print(data)
    sql = """DECLARE
                l_cursor  SYS_REFCURSOR;
                    pTotReg number DEFAULT 100;
                    pTotPaginas number DEFAULT 100;
                    pPagina number DEFAULT 1;
                    pLineas number DEFAULT 100;
                    pDeuda varchar2(50) DEFAULT null;
                    pCLiente varchar2(50) DEFAULT null;
                    pNoCia varchar2(10) DEFAULT '01';
                    pNoGrupo varchar2(10) DEFAULT '01';
                    pNombre varchar2(50) DEFAULT null;
                    pTipo varchar2(50) DEFAULT null;
                    pEstatus varchar2(50) DEFAULT null;
                    output number DEFAULT 1000000;
                    v_no_fisico varchar2(50);
                    v_codigo_cliente varchar2(50);
                    v_nombre_cliente varchar2(50);
                    v_tipo_venta varchar2(50);
                    v_fecha_vencimiento varchar2(50);
                    v_monto_inicial varchar2(50);
                    v_monto_actual  varchar2(50);
                    v_monto_inicial_usd varchar2(50);
                    v_monto_actual_usd  varchar2(50);
                    v_fecha_ultimo_pago varchar2(50);
                    v_monto_ultimo_pago varchar2(50);
                    v_estatus_deuda varchar2(50);
                    v_codigo_tipo_doc varchar2(50);
                    v_nombre_tipo_doc varchar2(50);
                    v_cia varchar(2);
                    v_grupo varchar2(2);
                    v_tipo_cambio varchar2(50);
                    v_fecha_aviso varchar2(50) ;
                    v_docu_aviso varchar2(50);
                    v_serie_fisico varchar2(15);
                    v_fecha_documento varchar2(10);
                    v_aplica_corte varchar2(1);
                    v_tot varchar2(50);
                    v_codigo_compani varchar2(10);
                    v_pagina varchar2(10);
                    v_linea varchar2(10);

                BEGIN
                    pTotReg  := {pTotReg};
                    pTotPaginas  := {pTotPaginas};
                    pPagina  := {pPagina};
                    pLineas  := {pLineas};
                    pDeuda := {pDeuda};
                    pNoCia := {pNoCia};
                    pNoGrupo := {pNoGrupo};
                    pCLiente := {pCLiente};
                    pNombre := {pNombre};
                    pTipo := {pTipo};
                    pEstatus := {pEstatus};

                    dbms_output.enable(output);

                    PROCESOSPW.deudas (l_cursor, pTotReg ,pTotPaginas, pPagina, pLineas, pNoCia, pNoGrupo, pCLiente);

                    -- PROCESOSPW.deudas (l_cursor, pTotReg ,pTotPaginas, pPagina, pLineas, pDeuda , pCLiente , pNombre, pTipo, pEstatus);

                    LOOP
                    FETCH l_cursor into
                    v_no_fisico,
                    v_codigo_cliente,
                    v_nombre_cliente,
                    v_tipo_venta,
                    v_fecha_vencimiento,
                    v_monto_inicial,
                    v_monto_actual,
                    v_monto_inicial_usd,
                    v_monto_actual_usd,
                    v_fecha_ultimo_pago,
                    v_monto_ultimo_pago,
                    v_estatus_deuda,
                    v_codigo_tipo_doc,
                    v_nombre_tipo_doc,
                    v_cia,
                    v_grupo,
                    v_tipo_cambio,
                    v_fecha_aviso,
                    v_docu_aviso,
                    v_serie_fisico,
                    v_fecha_documento,
                    v_aplica_corte,
                    v_pagina,
                    v_linea;
                        EXIT WHEN l_cursor%NOTFOUND;
                    dbms_output.put_line
                        (

                        v_no_fisico|| '|'||
                        v_codigo_cliente|| '|'||
                        v_nombre_cliente|| '|'||
                        v_tipo_venta|| '|'||
                        v_fecha_vencimiento|| '|'||
                        v_monto_inicial|| '|'||
                        v_monto_actual|| '|'||
                        v_monto_inicial_usd|| '|'||
                        v_monto_actual_usd|| '|'||
                        v_fecha_ultimo_pago|| '|'||
                        v_monto_ultimo_pago|| '|'||
                        v_estatus_deuda|| '|'||
                        v_codigo_tipo_doc|| '|'||
                        v_nombre_tipo_doc|| '|'||
                        v_cia|| '|'||
                        v_grupo|| '|'||
                        v_tipo_cambio|| '|'||
                        v_fecha_aviso|| '|'||
                        v_docu_aviso|| '|'||
                        v_serie_fisico|| '|'||
                        v_fecha_documento|| '|'||
                        v_aplica_corte
                        );
                    END LOOP;
                CLOSE l_cursor;

                END;""".format(
                                    pTotReg = data['pTotReg'],
                                    pTotPaginas = data['pTotPaginas'],
                                    pPagina = data['pPagina'],
                                    pLineas = data['pLineas'],
                                    pDeuda = data['pDeuda'],
                                    pNoCia = data['pNoCia'],
                                    pNoGrupo = data['pNoGrupo'],
                                    pCLiente = data['pCLiente'],
                                    pNombre = data['pNombre'],
                                    pTipo = data['pTipo'],
                                    pEstatus = data['pEstatus']
                                )

    print(sql)
    c.execute(sql)
    textVar = c.var(str)
    statusVar = c.var(int)
    list = []
    while True:
        c.callproc("dbms_output.get_line", (textVar, statusVar))
        if statusVar.getvalue() != 0:
            break
        arr = str(textVar.getvalue()).split("|")
        obj = {
            'no_fisico' :arr[0],
            'codigo_cliente' :arr[1],
            'nombre_cliente' :arr[2],
            'tipo_venta' :arr[3],
            'fecha_vencimiento' :arr[4],
            'monto_inicial' :arr[5],
            'monto_actual' :arr[6],
            'monto_inicial_usd' :arr[7],
            'monto_actual_usd' :arr[8],
            'fecha_ultimo_pago' :arr[9],
            'monto_ultimo_pago' :arr[10],
            'estatus_deuda' :arr[11],
            'codigo_tipo_doc' :arr[12],
            'nombre_tipo_doc' :arr[13],
            'cia' :arr[14],
            'grupo' :arr[15],
            'tipo_cambio' :arr[16],
            'fecha_aviso' :arr[17],
            'docu_aviso' :arr[18],
            'serie_fisico' :arr[19],
            'fecha_documento' :arr[20],
            'aplica_corte' :arr[21],

        }
        list.append(obj)
    return response.json({"msj":"OK", "obj": list}, 200)

    # return response.json({"msj":"OK"}, 200)

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
        return response.json({"msg": "Missing username parameter"}, status=400)
    else:
        data['pNoCia'] = "'"+data['pNoCia']+"'"

    if not 'pNoGrupo' in data :
        return response.json({"msg": "Missing username parameter"}, status=400)
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

    if not 'pArticulo' in data :
        data['pArticulo'] = 'null'
        data['haveArt'] = '--'
    else:
        data['haveArt'] = ""

    if not 'pCodProveedor' in data :
        data['pCodProveedor'] = 'null'
    else:
        data['pCodProveedor'] = "'"+data['pCodProveedor']+"'"

    if not 'pFiltroCategoria' in data :
        data['pFiltroCategoria'] = 'null'
    else:
        data['pFiltroCategoria'] = "'"+data['pFiltroCategoria']+"'"



    print(data)
    db = get_db()
    c = db.cursor()
    print(data)
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
            pArticulo varchar2(50) default null;
            pCodProveedor varchar2(15 )DEFAULT null;
            pFiltroCategoria varchar2(50) DEFAULT null;

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
                v_precio_usd varchar2(10);
                v_iva_usd varchar2(10);
                v_tipo_cambio number;
                v_proveedor varchar2(100);
                v_bodega varchar2(2);
                v_categoria varchar2(30);
                v_descuento1 number;
                v_descuento2 number;
                v_tipo_prod_emp varchar(20);
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
            {haveArt}         pArticulo := \'{pArticulo}\';
                                pCodProveedor := {pCodProveedor};
                                pFiltroCategoria := \'{pFiltroCategoria}\' ;



                dbms_output.enable(output);

                PROCESOSPW.productos (l_cursor, pTotReg ,pTotPaginas, pPagina, pLineas, pNoCia, pNoGrupo,pCliente,pBusqueda,pComponente, pArticulo, pFiltroCategoria, pCodProveedor );

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
                v_categoria,
                v_descuento1,
                v_descuento2,
                v_tipo_prod_emp,
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
                    v_categoria|| '|'||
                    v_descuento1|| '|'||
                    v_descuento2|| '|'||
                    v_tipo_prod_emp|| '|'||
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
                        pArticulo = data['pArticulo'],
                        haveArt = data['haveArt'],
                        pFiltroCategoria = data['pFiltroCategoria'],
                        pCodProveedor = data['pCodProveedor']
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
            'categoria': arr[16],
            'descuento1' : arr[17],
            'descuento2' : arr[18],
            'tipo_prod_emp' : arr[19],
            'pagina': arr[20],
            'linea': arr[21]
        }

        # if data['pArticulo'] == 'null'  :
        #     if int(arr[7]) > 0 :
        #         list.append(obj)
        # else:
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
    # else:
    #     data['pNoCia'] = "'"+data['pNoCia']+"'"

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
    sql = """DECLARE

      l_cursor  SYS_REFCURSOR;

                pTotReg number DEFAULT 100;
                pTotPaginas number DEFAULT 100;
                pPagina number DEFAULT 1;
                pLineas number DEFAULT 100;
                pDeuda number DEFAULT null;
                pNoCia varchar2(10) DEFAULT '01';
                pNoGrupo varchar2(10) DEFAULT '01';
                pCliente varchar2(50) DEFAULT null;
                pPedido varchar2(50) DEFAULT null;
                output number DEFAULT 1000000;
                pFechaFactura date;
                pFechaPedido date;

                v_nro_factura varchar2(50);

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

                v_total_producto_bs varchar2(20);

                v_total_producto_usd varchar2(20);

                v_cia        varchar2(2);

                v_grupo      varchar2(2);

                v_tipo_pedido varchar2(15);

                v_pag        number;

                v_lin        number;

                v_totreg     number;

                v_tot number:=0;


    BEGIN

              pTotReg  := {pTotReg};
              pTotPaginas  := {pTotPaginas};
              pPagina  := {pPagina};
              pLineas  := {pLineas};
              pDeuda := {pDeuda};
              pNoCia := {pNoCia};
              pNoGrupo := {pNoGrupo};
              pCliente := {pCliente};
              pFechaFactura := {pFechaFactura};
              pFechaPedido := {pFechaPedido};



         procesospw.pedidos_facturados (l_cursor,pTotReg ,pTotPaginas,pPagina,pLineas,pDeuda, pPedido, pNoCia, pNoGrupo,pCliente,pFechaFactura,pFechaPedido);





      LOOP

        FETCH l_cursor into

                v_nro_factura,

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

                v_total_producto_bs,

                v_total_producto_usd,

                v_cia,

                v_grupo,

                v_tipo_pedido,

                v_pag,

                v_lin;

        EXIT WHEN l_cursor%NOTFOUND;

        dbms_output.put_line

          (

                v_nro_factura|| '|'||

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

                v_total_producto_bs|| '|'||

                v_total_producto_usd|| '|'||

                v_cia || '|'||

                v_grupo || '|'||

                v_tipo_pedido|| '|'||

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
                        pNoCia = data['pNoCia'],
                        pNoGrupo = data['pNoGrupo'],
                        pCliente = data['pCliente'],
                        pNombre = data['pNombre'],
                        pFechaFactura = data['pFechaFactura'],
                        pFechaPedido = data['pFechaPedido']


                    )

    print(sql)
    c.execute(sql)
    textVar = c.var(str)
    statusVar = c.var(int)
    list = []
    while True:
        c.callproc("dbms_output.get_line", (textVar, statusVar))
        if statusVar.getvalue() != 0:
            break
        arr = str(textVar.getvalue()).split("|")
        obj = {

                'nro_factura': arr[0],
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
                'total_producto_usd': arr[14],
                'codigo_compani': arr[14],
                'grupo': arr[15],
                'tipo_pedido': arr[16]
                # 'linea': arr[17]
            }
        list.append(obj)

    return response.json({"msj": "OK", "obj": agrupar_facturas(list)}, 200)


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

async def update_detalle_pedido(detalle, ID):
    try:

            db = get_db()
            c = db.cursor()
            print(detalle)
            c.execute("""UPDATE PAGINAWEB.DETALLE_PEDIDO
                            SET
                                   CANTIDAD     = :CANTIDAD,
                                   PRECIO_BRUTO = :PRECIO_BRUTO
                            WHERE  ID_PEDIDO    = :ID_PEDIDO
                            AND    COD_PRODUCTO = :COD_PRODUCTO""",
                            [
                                int(0),
                                0,
                                ID,
                                detalle['COD_PRODUCTO']
                            ])
            db.commit()


            cantidad = 0
            disponible = await valida_art("01", detalle['COD_PRODUCTO'])

            if int(detalle['CANTIDAD']) > disponible :
                cantidad = disponible
            else:
                cantidad = detalle['CANTIDAD']

            c.execute("""UPDATE PAGINAWEB.DETALLE_PEDIDO
                            SET
                                   CANTIDAD     = :CANTIDAD,
                                   PRECIO_BRUTO = :PRECIO_BRUTO
                            WHERE  ID_PEDIDO    = :ID_PEDIDO
                            AND    COD_PRODUCTO = :COD_PRODUCTO""",
                            [
                                int(cantidad),
                                float(str(detalle['precio_bruto_bs']).replace(',','.')),
                                ID,
                                detalle['COD_PRODUCTO']
                            ])
            db.commit()

            return cantidad

    except Exception as e:
        logger.debug(e)

@app.route('/upd/detalle_producto',["POST","GET"])
@jwt_required
async def upd_detalle_producto_serv (request, token: Token):
# async def procedure(request):
    try:
        data = request.json

        reservado = await update_detalle_pedido(data['pedido'], data['ID'])

        msg = 0

        print("+===================================================")
        print(data['pedido']['CANTIDAD'])
        print(reservado)
        print("+===================================================")

        if data['pedido']['CANTIDAD'] > reservado:
            msg = 1

        return response.json({"msg": msg, "reserved":reservado },200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)

async def crear_detalle_pedido(detalle, ID):

        try:
            print("+===================================================")
            print("crear_detalle_pedido")
            print(detalle)
            print("+===================================================")


            cantidad = 0
            disponible = await valida_art("01", detalle['COD_PRODUCTO'])

            if int(detalle['CANTIDAD']) > disponible :
                cantidad = disponible
            else:
                cantidad = detalle['CANTIDAD']

            db = get_db()
            c = db.cursor()

            sql = """INSERT INTO DETALLE_PEDIDO ( ID_PEDIDO, COD_PRODUCTO, CANTIDAD, PRECIO_BRUTO, TIPO_CAMBIO, BODEGA)
                            VALUES ( {ID_PEDIDO}, \'{COD_PRODUCTO}\' ,  {CANTIDAD} ,  {PRECIO} , {TIPO_CAMBIO}, \'{BODEGA}\' )"""

            c.execute(sql.format(
                         ID_PEDIDO = int(ID),
                         COD_PRODUCTO = str(detalle['COD_PRODUCTO']),
                         CANTIDAD = int(cantidad),
                         PRECIO = float(str(detalle['precio_bruto_bs']).replace(',','.')),
                         TIPO_CAMBIO = float(str(detalle['tipo_cambio']).replace(',','.')) ,
                         BODEGA = detalle['bodega']
                    ))

            db.commit()

            await upd_estatus_pedido(1,int(ID))

            return cantidad

        except Exception as e:
            logger.debug(e)

async def upd_estatus_pedido(estatus, ID):

        db = get_db()
        c = db.cursor()

        sql = """
                    UPDATE PAGINAWEB.PEDIDO
                    SET
                        ESTATUS          = :ESTATUS,
                        FECHA_ESTATUS    = TO_CHAR(SYSDATE, 'DD-MM-YYYY')
                    WHERE  ID               = :ID

            """

        c.execute(sql, [estatus,ID])

        db.commit()

        sql = """select descripcion
                        from ESTATUS where codigo = :estatus"""
        c.execute(sql, [estatus])
        row = c.fetchone()
        return row[0]

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
        print("+===================================================")
        print(row[0])
        print('row[0]')
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

@app.route('/editar_pedido', ["POST", "GET"])
@jwt_required
async def editar_pedido(request, token : Token):
    try:
        data = request.json

        estatus = await upd_estatus_pedido(1,data['ID'])

        return response.json({"estatus" : estatus},200)
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

        reservado = await crear_detalle_pedido(data['pedido'], data['ID'])

        msg = 0

        if data['pedido']['CANTIDAD'] > reservado:
            msg = 1

        return response.json({"msg": msg, "reserved":reservado },200)
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
                                monto, count(t3.COD_PRODUCTO) producto,ID, t1.ESTATUS, TO_CHAR(FECHA_ESTATUS, 'DD-MM-YYYY')
                            FROM PAGINAWEB.PEDIDO t1
                            join PAGINAWEB.ESTATUS t2
                                on t1.ESTATUS = t2.CODIGO
                            left join PAGINAWEB.DETALLE_PEDIDO t3
                                on t1.ID = t3.ID_PEDIDO
                            {filter} WHERE COD_CLIENTE = {pCliente}
                             GROUP BY ID, COD_CIA, GRUPO_CLIENTE,
                                   COD_CLIENTE, FECHA_CARGA, NO_PEDIDO_CODISA,
                                   OBSERVACIONES,  t2.descripcion,  t1.ESTATUS, FECHA_ESTATUS
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
                    'estatus_id':row[10],
                    'fecha_estatus':row[11]


              }
            list.append(aux)


        return response.json({"data":list},200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)

@app.route('/get/pedidosV2',["POST","GET"])
@jwt_required
async def pedidosV2 (request , token: Token):
    try:
        data = request.json

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


        list = await procedure_pedidos(data['pNoCia'],data['pNoGrupo'],data['pCliente'])



        return response.json({"data":list},200)
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
                        v_precio_bruto_bs number;
                        v_precio_bruto_usd varchar2(10);
                        v_precio_neto_bs number;
                        v_iva_bs number;
                        v_precio_neto_usd varchar2(10);
                        v_iva_usd varchar2(10);
                        v_fecha_vence varchar2(10);


                      BEGIN


                          Procesospw.detalle_pedidos_cargados (l_cursor ,{idPedido});


                        LOOP

                          FETCH l_cursor into

                                  v_id_pedido ,
                                  v_cod_producto ,
                                  v_nombre_producto ,
                                  v_princ_activo ,
                                  v_unidades ,
                                  v_precio_bruto_bs ,
                                  v_precio_bruto_usd ,
                                  v_precio_neto_bs ,
                                  v_iva_bs ,
                                  v_precio_neto_usd ,
                                  v_iva_usd,
                                  v_fecha_vence;

                          EXIT WHEN l_cursor%NOTFOUND;

                          dbms_output.put_line

                            (


                                  v_id_pedido|| '|'||
                                  v_cod_producto|| '|'||
                                  v_nombre_producto|| '|'||
                                  v_princ_activo|| '|'||
                                  v_unidades|| '|'||
                                  v_precio_bruto_bs|| '|'||
                                  v_precio_bruto_usd|| '|'||
                                  v_precio_neto_bs|| '|'||
                                  v_iva_bs|| '|'||
                                  v_precio_neto_usd|| '|'||
                                  v_iva_usd|| '|'||
                                  v_fecha_vence


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
                  'precio_bruto_bs' : arr[5],
                  'precio_bruto_usd' : arr[6],
                  'precio_neto_bs': arr[7],
                  'PRECIO': arr[5],
                  'iva_bs': arr[8],
                  'precio_neto_usd': arr[9],
                  'iva_usd': arr[10],
                  'fecha_vence': arr[11]
            }
            list.append(obj)

        return list
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)

async def procedure_pedidos(cia,grupo,cliente):
    try:

        db = get_db()
        c = db.cursor()
        c.callproc("dbms_output.enable")
        c.execute("""DECLARE

                        l_cursor  SYS_REFCURSOR;
                        v_id_pedido number;
                        v_nombre_cliente varchar2(40);
                        v_direccion_cliente varchar2(200);
                        v_fecha_creacion DATE;
                        v_cod_estatus number;
                        v_estatus varchar2(80);
                        v_fecha_estatus DATE;
                        pNoCia varchar2(10) DEFAULT '01';
                        pNoGrupo varchar2(10) DEFAULT '01';
                        pCliente varchar2(50) DEFAULT null;

                      BEGIN

                          pNoCia := {pNoCia};
                          pNoGrupo := {pNoGrupo};
                          pCliente := {pCliente};

                          Procesospw.pedidos_cargados (l_cursor ,pNoCia, pNoGrupo,pCliente);

                        LOOP

                          FETCH l_cursor into
                                  v_id_pedido,

                                  v_nombre_cliente,

                                  v_direccion_cliente,

                                  v_fecha_creacion,

                                  v_cod_estatus,

                                  v_estatus,

                                  v_fecha_estatus;

                          EXIT WHEN l_cursor%NOTFOUND;

                          dbms_output.put_line

                            (
                                  v_id_pedido|| '|'||

                                  v_nombre_cliente|| '|'||

                                  v_direccion_cliente|| '|'||

                                  v_fecha_creacion|| '|'||

                                  v_cod_estatus|| '|'||

                                  v_estatus|| '|'||

                                  v_fecha_estatus


                            );

                        END LOOP;


                        CLOSE l_cursor;


                      END;
        """.format(
                    pNoCia = cia,
                    pNoGrupo = grupo,
                    pCliente = cliente
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
                  'ID': arr[0],
                  'nombre_cliente': arr[1],
                  'direccion_cliente': arr[2],
                  'fecha_creacion': arr[3],
                  'cod_estatus': arr[4],
                  'estatus': arr[5],
                  'fecha_estatus': arr[6]
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

        # mongodb = get_mongo_db()

        db = get_db()
        c = db.cursor()

        pedidos = await procedure_detalle_pedidos(int(data['idPedido']))
        errores = await log_errores(int(data['idPedido']))
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
                    'estatus_id':row[7],
                    'pedido': pedidos,
                    'errores':errores,
                    # 'totales':totales,
              }

            list.append(aux)

        return response.json({"msj": "OK", "obj": list}, 200)
    except Exception as e:
        logger.debug(e)
        return response.json("ERROR",400)



async def log_errores(idPedido):
    try:

        db = get_db()
        c = db.cursor()

        c.execute("""SELECT
                         COD_PRODUCTO, TO_CHAR(FECHA, 'DD-MM-YYYY'),
                           t2.DESCRIPCION
                        FROM PAGINAWEB.REGISTRO_ERROR t1
                        JOIN TIPO_ERROR t2 on t1.COD_ERROR = t2.CODIGO
                        WHERE t1.ID_PEDIDO = {idPedido}
                        """.format( idPedido = idPedido ))
        list = []
        for row in c:
            aux = {}
            aux = {
                    'COD_PRODUCTO':row[0],
                    'FECHA':row[1],
                    'DESCRIPCION':row[2]
              }

            list.append(aux)

        return list
    except Exception as e:
        logger.debug(e)
        return e

@app.route('/procedure_prove', ["POST", "GET"])
async def procedure_prove(request):

    data = request.json

    db = get_db()
    c = db.cursor()

    c.callproc("dbms_output.enable")
    c.execute("""
                DECLARE
                l_cursor  SYS_REFCURSOR;
                output number DEFAULT 1000000;

                v_cod_proveedor varchar2(20);
                v_nom_proveedor varchar2(50);
            BEGIN


                dbms_output.enable(output);
                PROCESOSPW.proveedores (l_cursor);

            LOOP
            FETCH l_cursor into

                v_cod_proveedor,
                v_nom_proveedor;
                EXIT WHEN l_cursor%NOTFOUND;
            dbms_output.put_line
                (
                v_cod_proveedor|| '|'||
                v_nom_proveedor
                );
            END LOOP;
            CLOSE l_cursor;
        END;
            """)
    textVar = c.var(str)
    statusVar = c.var(int)
    list = []
    while True:
        c.callproc("dbms_output.get_line", (textVar, statusVar))
        if statusVar.getvalue() != 0:
            break
        arr = str(textVar.getvalue()).split("|")
        obj = {
        'cod_proveedor' : arr[0],
        'nombre_proveedor': arr[1]
        }
        list.append(obj)
    return response.json({"msj": "OK", "obj": list}, 200)


app.run(host='0.0.0.0', port = port, debug = True)
