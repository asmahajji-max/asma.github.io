const DIVISEUR = 36000;
const unit = " DT";
const jr = " jours";
function showModule(id) {
    document.querySelectorAll('.module').forEach(m => m.style.display = "none");
    document.getElementById(id).style.display = "block";
}
function nbJours(dateDebut, dateFin) {
    const d1 = new Date(dateDebut);
    const d2 = new Date(dateFin);
    return (d2 - d1) / (1000 * 60 * 60 * 24);
}
function toISODateString(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function addDays(dateStr, nb) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + nb);
    return toISODateString(d);
}
function ligne(label, value) {
    return `<tr><td>${label}</td><td>${value}</td></tr>`;
}
function toggleDynamicInput(checkboxId, inputDivId) {
    const checked = document.getElementById(checkboxId).checked;
    document.getElementById(inputDivId).style.display = checked ? 'block' : 'none';
}
function calculerEpargne() {
    const C0 = parseFloat(document.getElementById("ep_C0").value);
    const t = parseFloat(document.getElementById("ep_t").value);
    const d1 = document.getElementById("ep_date_debut").value;
    const d2 = document.getElementById("ep_date_fin").value;

    const n = nbJours(d1, d2);
    if (isNaN(C0) || isNaN(t) || !d1 || !d2 || n <= 0) {
        alert("Veuillez saisir un capital, un taux et des dates valides.");
        return;
    }

    const interets = (C0 * t * n) / DIVISEUR;
    const capitalFinal = C0 + interets;

    let tbody = "";
    tbody += ligne("Capital initial ", C0.toFixed(2) + unit);
    tbody += ligne("Taux annuel ", t.toFixed(2) + " %");
    tbody += ligne("nombre de jours", n + jr);
    tbody += ligne("Intérêt simple ", interets.toFixed(2) + unit);
    tbody += ligne("Capital final ", capitalFinal.toFixed(2) + unit);

    document.querySelector("#epargne_resultat_table tbody").innerHTML = tbody;
}

let operations = [];

function mettreAJourDateValeurAuto() {
    const type = document.getElementById("op_type").value;
    const dateOp = document.getElementById("op_date_operation").value;
    if (!type || !dateOp) return;

    let dateValeur;
    if (type === "retrait") {
        dateValeur = addDays(dateOp, -7);
    } else if (type === "versement") {
        dateValeur = addDays(dateOp, 7);
    }
    document.getElementById("op_date_valeur").value = dateValeur;
}

function ajouterOperationDepuisChoix() {
    const type = document.getElementById("op_type").value;
    if (!type) {
        alert("Veuillez choisir le type d'opération (retrait ou versement).");
        return;
    }
    ajouterOperation(type);
}

function ajouterOperation(type) {
    const montant = parseFloat(document.getElementById("op_montant").value);
    const libelle = document.getElementById("op_libelle").value;
    const dateOperation = document.getElementById("op_date_operation").value;
    const dateValeur = document.getElementById("op_date_valeur").value;

    if (isNaN(montant) || montant <= 0) { alert("Montant invalide"); return; }
    if (!libelle) { alert("Libellé obligatoire"); return; }
    if (!dateOperation) { alert("Date d'opération obligatoire"); return; }
    if (!dateValeur) { alert("Date de valeur manquante (elle doit être calculée automatiquement)."); return; }

    operations.push({
        type,
        libelle,
        montant,
        dateOperation,
        dateValeur
    });

 
    operations.sort((a, b) => new Date(a.dateValeur) - new Date(b.dateValeur));

    afficherOperations();
    document.getElementById("op_type").value = "";
    document.getElementById("op_libelle").value = "";
    document.getElementById("op_montant").value = "";
    document.getElementById("op_date_operation").value = "";
    document.getElementById("op_date_valeur").value = "";
}

function supprimerOperation(index) {
    operations.splice(index, 1);
    afficherOperations();
}
function afficherOperations() {
    const tbody = document.querySelector("#operations_table tbody");
    tbody.innerHTML = "";
    operations.forEach((op, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${op.libelle}</td>
                <td>${op.montant.toFixed(3)} DT</td>
                <td>${op.type}</td>
                <td>${op.dateOperation}</td>
                <td>${op.dateValeur}</td>
                <td><button onclick="supprimerOperation(${i})">Supprimer</button></td>
            </tr>
        `;
    });
}
function genererEchelleInterets() {
    const tbody = document.querySelector("#cc_echelle_table tbody");
    tbody.innerHTML = "";

    const C0 = parseFloat(document.getElementById("cc_C0").value);
    const t = parseFloat(document.getElementById("cc_t").value);
    const dDebut = document.getElementById("cc_date_debut").value;
    const dFin   = document.getElementById("cc_date_fin").value;

    if (isNaN(C0) || isNaN(t) || !dDebut || !dFin) {
        alert("Solde initial, taux ou dates de période manquants.");
        return;
    }

    let lignes = [];
    let solde = C0;
    let derniereDateValeur = dDebut;
    lignes.push({
        dateOper: dDebut,
        dateValeur: dDebut,
        operation: 0,
        solde: solde,
        nbJours: 0,
        taux: t,
        interet: 0
    });
    operations.forEach(op => {
        const dv = op.dateValeur;
        const n = nbJours(derniereDateValeur, dv);

        if (n > 0) {
            const interetTranche = (solde * t * n) / DIVISEUR;
            lignes.push({
                dateOper: op.dateOperation,
                dateValeur: dv,
                operation: 0,
                solde: solde,
                nbJours: n,
                taux: t,
                interet: interetTranche
            });
        }

        const opSignee = (op.type === "retrait" ? -op.montant : op.montant);
        solde += opSignee;
        lignes.push({
            dateOper: op.dateOperation,
            dateValeur: dv,
            operation: opSignee,
            solde: solde,
            nbJours: 0,
            taux: t,
            interet: 0
        });

        derniereDateValeur = dv;
    });
    const nDernier = nbJours(derniereDateValeur, dFin);
    if (nDernier > 0) {
        const interetTranche = (solde * t * nDernier) / DIVISEUR;
        lignes.push({
            dateOper: dFin,
            dateValeur: dFin,
            operation: 0,
            solde: solde,
            nbJours: nDernier,
            taux: t,
            interet: interetTranche
        });
    }

    let totalInterets = 0;
    lignes.forEach(l => {
        totalInterets += l.interet;
        tbody.innerHTML += `
            <tr>
                <td>${l.dateOper}</td>
                <td>${l.dateValeur}</td>
                <td>${l.operation.toFixed(3)}</td>
                <td>${l.solde.toFixed(3)}</td>
                <td>${l.nbJours}</td>
                <td>${l.taux.toFixed(2)}</td>
                <td>${l.interet.toFixed(3)}</td>
            </tr>
        `;
    });

    tbody.innerHTML += `
        <tr>
            <td colspan="6"><strong>Total intérêts bruts</strong></td>
            <td><strong>${totalInterets.toFixed(3)}</strong></td>
        </tr>
    `;
}

function calculerCompteCourant() {
    genererEchelleInterets();
}
function createTableRow(label, value) {
    return `<tr><td>${label}</td><td>${value}</td></tr>`;
}

function calculerEscompte() {
    const Vn = parseFloat(document.getElementById('esc_C0').value);
    const t_percent = parseFloat(document.getElementById('esc_t').value);
    const dateDebutStr = document.getElementById('esc_date_debut').value;
    const dateFinStr = document.getElementById('esc_date_fin').value;

    const dateDebut = new Date(dateDebutStr);
    const dateFin = new Date(dateFinStr);

    if (isNaN(Vn) || isNaN(t_percent) || !dateDebutStr || !dateFinStr) {
        alert("Veuillez saisir une valeur nominale, un taux et des dates valides.");
        return;
    }

    if (dateFin < dateDebut) { 
        alert("La date d'échéance doit être postérieure à la date de remise.");
        return; 
    }

    const n_jours = Math.ceil((dateFin - dateDebut) / (1000 * 60 * 60 * 24));
    const escompte = (Vn * t_percent * n_jours) / DIVISEUR;

    let totalCommissionsHT = 0;
    const com_endos = document.getElementById('esc_com_endos_check').checked ? 
                        (parseFloat(document.getElementById('esc_com_endos_val').value) || 0) : 0;
    const com_service = document.getElementById('esc_com_service_check').checked ? 
                        (parseFloat(document.getElementById('esc_com_service_val').value) || 0) : 0;
    totalCommissionsHT = com_endos + com_service;

    const tva_rate = document.getElementById('esc_tva_check').checked ? 
                      (parseFloat(document.getElementById('esc_tva_val').value) || 0) / 100 : 0;
    const montantTVA = totalCommissionsHT * tva_rate;

    const totalFraisTTC = escompte + totalCommissionsHT + montantTVA;
    const valeurNette = Vn - totalFraisTTC;

    let tableBody = ``;
    tableBody += createTableRow("Valeur Nominale Vn", Vn.toFixed(2) + " dt");
    tableBody += createTableRow("Taux d'Escompte t", t_percent.toFixed(2) + " %");
    tableBody += createTableRow("nombre de jours", n_jours + " jours");
    tableBody += createTableRow("---", "---");
    tableBody += createTableRow("Intérêts d'escompte (E)", `<strong style="color: #d9534f;">${escompte.toFixed(2)} dt</strong>`);

    if (com_endos > 0) tableBody += createTableRow("Commission d'Endos (HT)", com_endos.toFixed(2) + " dt");
    if (com_service > 0) tableBody += createTableRow("Commission de Service (HT)", com_service.toFixed(2) + " dt");
    if (totalCommissionsHT > 0) tableBody += createTableRow("Total Commissions HT", totalCommissionsHT.toFixed(2) + " dt");
    if (montantTVA > 0) tableBody += createTableRow("TVA sur Commissions", montantTVA.toFixed(2) + " dt");

    tableBody += createTableRow("---", "---");
    tableBody += createTableRow("Total Charges (Escompte + Commissions + TVA)", `<strong style="color: #d9534f;">${totalFraisTTC.toFixed(2)} dt</strong>`);
    tableBody += createTableRow("Valeur Nette Reçue", `<strong style="color: green;">${valeurNette.toFixed(2)} dt</strong>`);

    document.getElementById('escompte_resultat_table').getElementsByTagName('tbody')[0].innerHTML = tableBody;
}
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.module').forEach(mod => mod.style.display = 'none');
    showModule('epargne');
});