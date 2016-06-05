
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

var pacienti = [];
var stevecPacientov = 0;

/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Generator podatkov za novega pacienta, ki bo uporabljal aplikacijo. Pri
 * generiranju podatkov je potrebno najprej kreirati novega pacienta z
 * določenimi osebnimi podatki (ime, priimek in datum rojstva) ter za njega
 * shraniti nekaj podatkov o vitalnih znakih.
 * @param stPacienta zaporedna številka pacienta (1, 2 ali 3)
 * @return ehrId generiranega pacienta
 */
function generirajPodatke(stPacienta) {
  var ehrId = "";
  var sessionId = getSessionId();

  $.ajaxSetup({
        headers: {"Ehr-Session": sessionId}
    });
    $.ajax({
        url: baseUrl + "/ehr",
        type: 'POST',
        success: function (data) {
            var ehrId = data.ehrId;
            var partyData = {
                firstNames: pacienti[stPacienta-1].ime,
                lastNames: pacienti[stPacienta-1].priimek,
                dateOfBirth: pacienti[stPacienta-1].datumRojstva,
                partyAdditionalInfo: [{key: "ehrId", value: ehrId}, {key: "drzava", value: pacienti[stPacienta-1].drzava}]
            };
            $.ajax({
                url: baseUrl + "/demographics/party",
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(partyData),
                success: function (party) {
                    if (party.action == 'CREATE') {
                        $("#kreirajSporocilo").append("<span class='obvestilo " +
                      "label label-success fade-in'>Uspešno kreiran EHR '" +
                      ehrId + "'.</br></span>");
                        setTimeout(function() {
                          $("#kreirajSporocilo").html("");
                        }, 5000);
                        stevecPacientov++;
                        $("#preberiObstojeciEHR").append("<option value=\"" + ehrId + "\">Pacient " + stevecPacientov + "</option>");
                    }
                    
                    $.ajaxSetup({
                		    headers: {"Ehr-Session": sessionId}
                		});
                		var podatki = {
                		    "ctx/language": "en",
                		    "ctx/territory": "SI",
                		    "vital_signs/height_length/any_event/body_height_length": pacienti[stPacienta-1].telesnaVisina,
                		    "vital_signs/body_weight/any_event/body_weight": pacienti[stPacienta-1].telesnaTeza,
                		   	"vital_signs/body_temperature/any_event/temperature|magnitude": pacienti[stPacienta-1].telesnaTemperatura,
                		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
                		    "vital_signs/blood_pressure/any_event/systolic": pacienti[stPacienta-1].sistoličniTlak,
                		    "vital_signs/blood_pressure/any_event/diastolic": pacienti[stPacienta-1].diastolicniTlak,
                		};
                		var parametriZahteve = {
                		    "ehrId": ehrId,
                            templateId: 'Vital Signs',
                            format: 'FLAT',
                            committer: 'Sestra Brigita'
                		};
                		$.ajax({
                		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
                		    type: 'POST',
                		    contentType: 'application/json',
                		    data: JSON.stringify(podatki),
                		    success: function (res) {
                		      //  $("#kreirajSporocilo").html(
                        //       "<span class='obvestilo label label-success fade-in'>" +
                        //       res.meta.href + ".</span>");
                		    },
                		    error: function(err) {
                		    	$("#kreirajSporocilo").html(
                            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                            JSON.parse(err.responseText).userMessage + "'!");
                		    }
                		});
                },
                error: function(err) {
                	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                "label-danger fade-in'>Napaka '" +
                JSON.parse(err.responseText).userMessage + "'!");
                }
            });
        }
    });
    
    

  return ehrId;
}

pacienti = [
    {
        ime: "Bogdan",
        priimek: "Blizusmrtnik",
        datumRojstva: "1945-10-10T14:58",
        drzava: "Slovenia",
        telesnaVisina: "180",
        telesnaTeza: "85",
        telesnaTemperatura: "38.20",
        sistoličniTlak: "140",
        diastolicniTlak: "90"
    },
    {
        ime: "Zdravko",
        priimek: "Vitalnik",
        datumRojstva: "1995-06-14T16:15",
        drzava: "Slovenia",
        telesnaVisina: "193",
        telesnaTeza: "80",
        telesnaTemperatura: "36.60",
        sistoličniTlak: "130",
        diastolicniTlak: "70"
    },
    {
        ime: "Kid",
        priimek: "Yang",
        datumRojstva: "2006-03-01T05:58",
        drzava: "China",
        telesnaVisina: "100",
        telesnaTeza: "35",
        telesnaTemperatura: "37.20",
        sistoličniTlak: "105",
        diastolicniTlak: "75"
    }
];

function generirajVzorcne() {
    for (var i = 1; i < 4; i++) {
        generirajPodatke(i);
    }
}



function dodajPacienta() {
	var sessionId = getSessionId();
	
	var ehrID;
	var ime = $("#dodajIme").val();
	var priimek = $("#dodajPriimek").val();
	var datumRojstva = $("#dodajDatumRojstva").val();
	var tempDrzava = $("#dodajDrzava").val();
	var telesnaVisina = $("#dodajTelesnaVisina").val();
	var telesnaTeza = $("#dodajTelesnaTeza").val();
	var telesnaTemperatura = $("#dodajTelesnaTemperatura").val();
	var sistolicniKrvniTlak = $("#dodajKrvniTlakSistolicni").val();
	var diastolicniKrvniTlak = $("#dodajKrvniTlakDiastolicni").val();
	
	if (ime.length == 0 || priimek.length == 0 || datumRojstva.length == 0 || tempDrzava == 0 || telesnaTemperatura == 0 || telesnaTeza == 0 || telesnaVisina == 0
	|| sistolicniKrvniTlak.length == 0 || diastolicniKrvniTlak == 0) {
	    $("#kreirajSporocilo").html(
                            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                            "manjkajoči podatki!");
                             setTimeout(function() {
                          $("#kreirajSporocilo").html("");
                        }, 5000);
                            return;
	}
	
	$.ajaxSetup({
        headers: {"Ehr-Session": sessionId}
    });
    $.ajax({
        url: baseUrl + "/ehr",
        type: 'POST',
        success: function (data) {
            var ehrId = data.ehrId;
            var partyData = {
                firstNames: ime,
                lastNames: priimek,
                dateOfBirth: datumRojstva,
                partyAdditionalInfo: [{key: "ehrId", value: ehrId}, {key: "drzava", value: tempDrzava}]
            };
            $.ajax({
                url: baseUrl + "/demographics/party",
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(partyData),
                success: function (party) {
                    ehrID = ehrId;
                    if (party.action == 'CREATE') {
                        $("#kreirajSporocilo").append("<span class='obvestilo " +
                      "label label-success fade-in'>Uspešno kreiran EHR '" +
                      ehrId + "'.</br></span>");
                        setTimeout(function() {
                          $("#kreirajSporocilo").html("");
                        }, 5000);
                        stevecPacientov++;
                        $("#preberiObstojeciEHR").append("<option value=\"" + ehrId + "\">" + $("#dodajIme").val() + " " + $("#dodajPriimek").val() + "</option>");
                    }
                    
                    $.ajaxSetup({
                		    headers: {"Ehr-Session": sessionId}
                		});
                		var podatki = {
                		    "ctx/language": "en",
                		    "ctx/territory": "SI",
                		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
                		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
                		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
                		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
                		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
                		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
                		};
                		var parametriZahteve = {
                		    "ehrId": ehrID,
                            templateId: 'Vital Signs',
                            format: 'FLAT',
                            committer: 'Sestra Brigita'
                		};
                		$.ajax({
                		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
                		    type: 'POST',
                		    contentType: 'application/json',
                		    data: JSON.stringify(podatki),
                		    success: function (res) {
                		        $("#kreirajSporocilo").html(
                              "<span class='obvestilo label label-success fade-in'>" +
                              res.meta.href + ".</span>");
                		    },
                		    error: function(err) {
                		    	$("#kreirajSporocilo").html(
                            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                            JSON.parse(err.responseText).userMessage + "'!");
                		    }
                		});
                },
                error: function(err) {
                	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                "label-danger fade-in'>Napaka '" +
                JSON.parse(err.responseText).userMessage + "'!");
                }
            });
        }
    });
}

var drzava = "Slovenia";
var drzave = [];
var povSmrtDrzava;

$(document).ready(function() {
    $('#preberiObstojeciEHR').change(function() {
    	$("#preberiSporocilo").html("");
    	$("#preberiEHRid").val($(this).val());
    });
    
    
    $("#odstopanjeLetCelo").hide();
    $("#odstopanjeITMCelo").hide();
    $("#odstopanjeITMCelo2").hide();
    $("#odstopanjeTempCelo").hide();
    $("#odstopanjeSisCelo").hide();
    $("#odstopanjeDiaCelo").hide();
    $("#izpisPodatkov").hide();
    $("#izpisSmrti").hide();
    $("#seEnId").hide();
    
    $.ajax({
    	url: "http://apps.who.int/gho/athena/data/GHO/WHOSIS_000001,WHOSIS_000002.json?profile=simple&filter=COUNTRY:*;YEAR:2015",
    	jsonp: "callback", 
        dataType: 'jsonp',
    	success: function (data) {
    		drzave = data;
    		for (var i = 0; i < drzave.fact.length; i++) {
        	    if (drzave.fact[i].dim.COUNTRY == drzava) {
        	        povSmrtDrzava = drzave.fact[i].Value;
        	        break;
        	    }
    		}
    	},
    	error: function(err) {
    		$("#preberiSporocilo").html("<span class='obvestilo label " +
      "label-danger fade-in'>Napaka '" +
      JSON.parse(err.responseText).userMessage + "'!");
    	}
    });
});

function izracunajSmrt() {
    $("#seEnId").toggle(500);
    
    // window.scrollTo(0,document.body.scrollHeight);
    
    var letaDoSmrti = 0;
    
	var starost = $("#izpisDatumRojstva").text().slice(0, 4);
	letaDoSmrti += parseInt(povSmrtDrzava) - (2016-parseInt(starost));
// 	console.log(letaDoSmrti);
	letaDoSmrti -= (parseInt($("#izpisSistolicniTlak").text()) - 110) * 0.1;
// 	console.log(letaDoSmrti);
	letaDoSmrti -= (parseInt($("#izpisDiastolicniTlak").text()) - 70) * 0.1;
// 	console.log(letaDoSmrti);
	letaDoSmrti -= (parseInt($("#izpisTelesnaTemperatura").text()) - 36.5) * 2;
// 	console.log(letaDoSmrti);
	var teza = parseInt($("#izpisTelesnaTeza").text());
	var visina = parseInt($("#izpisTelesnaVisina").text()) / 100;
	letaDoSmrti -= Math.abs(teza / (visina*visina) - 20) * 0.5;
	letaDoSmrti = Math.round(letaDoSmrti);
	if (letaDoSmrti >= 0) {
	    $("#stLet").text(letaDoSmrti);
	    $("#skrijSmrt2").hide();
	} else {
	    $("#stLet2").text(Math.abs(letaDoSmrti));
	    $("#skrijSmrt").hide();
	}
}

function vecInfo(gumb) {
    if (gumb == "datum") {
        var starost = $("#izpisDatumRojstva").text().slice(0, 4);
        $("#odstopanjeLet").text(Math.abs(Math.round((povSmrtDrzava) - (2016-parseInt(starost)))));
        $("#vplivLeta").text((Math.round(povSmrtDrzava) - (2016-parseInt(starost))));
        
        $("#odstopanjeLetCelo").toggle(500);
        $("#odstopanjeITMCelo").hide();
        $("#odstopanjeITMCelo2").hide();
        $("#odstopanjeTempCelo").hide();
        $("#odstopanjeSisCelo").hide();
        $("#odstopanjeDiaCelo").hide();
    } else if (gumb == "visina") {
        var teza = parseInt($("#izpisTelesnaTeza").text());
    	var visina = parseInt($("#izpisTelesnaVisina").text()) / 100;
        $("#odstopanjeITM").text(Math.abs(Math.round(teza / (visina*visina) - 20)));
        $("#vplivITM").text((-1)*(Math.abs(Math.round(teza / (visina*visina) - 20) * 0.5)));
        
        $("#odstopanjeLetCelo").hide();
        $("#odstopanjeITMCelo").toggle(500);
        $("#odstopanjeITMCelo2").hide();
        $("#odstopanjeTempCelo").hide();
        $("#odstopanjeSisCelo").hide();
        $("#odstopanjeDiaCelo").hide();
    } else if (gumb == "teza") {
        var teza = parseInt($("#izpisTelesnaTeza").text());
    	var visina = parseInt($("#izpisTelesnaVisina").text()) / 100;
        $("#odstopanjeITM2").text(Math.abs(Math.round(teza / (visina*visina) - 20)));
        $("#vplivITM2").text((-1)*(Math.abs(Math.round(teza / (visina*visina) - 20) * 0.5)));
        
        $("#odstopanjeLetCelo").hide();
        $("#odstopanjeITMCelo").hide()
        $("#odstopanjeITMCelo2").toggle(500);
        $("#odstopanjeTempCelo").hide();
        $("#odstopanjeSisCelo").hide();
        $("#odstopanjeDiaCelo").hide();
    } else if (gumb == "temp") {
        $("#odstopanjeTemp").text(Math.abs(Math.round(parseInt($("#izpisTelesnaTemperatura").text()) - 36.5)));
        $("#vplivTemp").text((-1)*(Math.round((parseInt($("#izpisTelesnaTemperatura").text()) - 36.5) * 2)));
        
        $("#odstopanjeLetCelo").hide();
        $("#odstopanjeITMCelo").hide();
        $("#odstopanjeTempCelo").toggle(500);
        $("#odstopanjeITMCelo2").hide();
        $("#odstopanjeSisCelo").hide();
        $("#odstopanjeDiaCelo").hide();
    } else if (gumb == "sis") {
        $("#odstopanjeSis").text(Math.abs(Math.round(parseInt($("#izpisSistolicniTlak").text()) - 110)));
        $("#vplivSis").text((-1)*((parseInt($("#izpisSistolicniTlak").text()) - 110) * 0.1));
        
        $("#odstopanjeLetCelo").hide();
        $("#odstopanjeITMCelo").hide();
        $("#odstopanjeITMCelo2").hide();
        $("#odstopanjeTempCelo").hide();
        $("#odstopanjeSisCelo").toggle(500);
        $("#odstopanjeDiaCelo").hide();
    } else if (gumb == "dia") {
        $("#odstopanjeDia").text(Math.abs(Math.round(parseInt($("#izpisDiastolicniTlak").text()) - 70)));
        $("#vplivDia").text((-1)*((parseInt($("#izpisDiastolicniTlak").text()) - 70) * 0.1));
        
        $("#odstopanjeLetCelo").hide();
        $("#odstopanjeITMCelo").hide();
        $("#odstopanjeITMCelo2").hide();
        $("#odstopanjeTempCelo").hide();
        $("#odstopanjeSisCelo").hide();
        $("#odstopanjeDiaCelo").toggle(500);
    }
}

function IzpisPodatkov() {
	var sessionId = getSessionId();
	
	$("#seEnId").hide();
	
	var ehrId = $("#preberiEHRid").val();
	$("#izpisEHRID").text(ehrId);
    if (ehrId.length == 0) {
    	return;
	}
	
	$("#izpisPodatkov").show(500);
	$("#izpisSmrti").show(500);
	
	var authorization = "Basic " + btoa(username + ":" + password);
	
	$.ajax({
        url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
        type: 'GET',
        headers: {
            "Authorization": authorization
        },
        success: function (data) {
            var party = data.party;
            $("#izpisIme").text(party.firstNames);
            $("#izpisPriimek").text(party.lastNames);
            $("#izpisDatumRojstva").text(party.dateOfBirth);
            for (var i = 0; i < party.partyAdditionalInfo.length; i++) {
                if (party.partyAdditionalInfo[i].key == "drzava") {
                    $("#izpisDrzava").text(party.partyAdditionalInfo[i].value);
                    drzava = party.partyAdditionalInfo[i].value;
                }
            }   
        }
    });
	
    $.ajax({
        url: baseUrl + "/view/" + ehrId + "/blood_pressure",
        type: 'GET',
        success: function (res) {
            $("#izpisSistolicniTlak").text(res[0].systolic);
        }
    });
    
     $.ajax({
        url: baseUrl + "/view/" + ehrId + "/blood_pressure",
        type: 'GET',
        success: function (res) {
            $("#izpisDiastolicniTlak").text(res[0].diastolic);
        }
    });
    
	$.ajax({
        url: baseUrl + "/view/" + ehrId + "/body_temperature",
        type: 'GET',
        success: function (res) {
            $("#izpisTelesnaTemperatura").text(res[0].temperature);
        }
    });
    
    $.ajax({
        url: baseUrl + "/view/" + ehrId + "/body_temperature",
        type: 'GET',
        success: function (res) {
            $("#izpisTelesnaTemperatura").text(res[0].temperature);
        }
    });
    
    $.ajax({
        url: baseUrl + "/view/" + ehrId + "/weight",
        type: 'GET',
        success: function (res) {
            $("#izpisTelesnaTeza").text(res[0].weight);
        }
    });
    
    $.ajax({
        url: baseUrl + "/view/" + ehrId + "/height",
        type: 'GET',
        success: function (res) {
            $("#izpisTelesnaVisina").text(res[0].height);
        }
    });
}

