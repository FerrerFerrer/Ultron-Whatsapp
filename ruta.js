
const obtenerZona = idZona => {
    switch (idZona) {
        case 1:
            return 'Saltillo';
        case 2:
            return 'Monterrey';
        case 3:
            return 'Otra';
    }
}
const enviarHubspot = async (correo, nombre, apellido, telefono, necesidad, localidad, otraLocalidad = 'Sin especificar', nombreVendedor, idSolicitud) => {
    const formJson = {
        "fields": [
            {
                "objectTypeId": "0-1",
                "name": "email",
                "value": correo
            },
            {
                "objectTypeId": "0-1",
                "name": "firstname",
                "value": nombre
            },
            {
                "objectTypeId": "0-1",
                "name": "lastname",
                "value": apellido
            },
            {
                "objectTypeId": "0-1",
                "name": "phone",
                "value": telefono
            },
            {
                "objectTypeId": "0-1",
                "name": "cual_es_la_necesidad_inmediata_",
                "value": necesidad
            },
            {
                "objectTypeId": "0-1",
                "name": "localidad_de_solicitud",
                "value": localidad
            },
            {
                "objectTypeId": "0-1",
                "name": "vendedor",
                "value": nombreVendedor
            },
            {
                "objectTypeId": "0-1",
                "name": "no__cotizacion",
                "value": idSolicitud
            }
        ]
    }

    // Set method and headers
    const init = {
        method: 'POST',
        body: JSON.stringify(formJson),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Content-Length': JSON.stringify(formJson).length
        }
    }

    // Send request to Letrimex Backend
    let req = await fetch('https://api.hsforms.com/submissions/v3/integration/submit/20638481/6fd6d78b-1dc7-462b-a409-137be0665542', init);
}