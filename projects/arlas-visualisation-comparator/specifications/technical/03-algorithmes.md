# Spécification technique — Algorithmes clés (pseudo-code déterministe)

> **Référentiel source** : *Spécification fonctionnelle : Comparaison de visualisations d'imagerie (V1)* (`05-spec-comparaison-visu-raster-v1.md`).  
> **Voir aussi** : `00-index-adr.md` · `01-modele-etat.md` · `02-composants-services.md` · `05-tests-tracabilite.md`

---

## 6. Algorithmes clés (pseudo-code déterministe)

### 6.1 Utilitaires communs d'ordonnancement et de visualisation par défaut (RF-18, RF-27)

```text
// Comparaison lexicographique déterministe par point de code UTF-16, 100 % indépendante de la locale OS/ICU :
FONCTION compareStringsAsc(a: string, b: string) -> entier :
    RETOURNER SI a < b ALORS -1 SINON SI a > b ALORS 1 SINON 0

FONCTION isVisualizable(item: ComparisonItem) -> booléen :
    RETOURNER item.visualizations.length > 0

FONCTION compareItemsMostRecentFirst(a: ComparisonItem, b: ComparisonItem) -> entier :
    SI a.acquisitionEpochMs != b.acquisitionEpochMs ALORS
        RETOURNER b.acquisitionEpochMs - a.acquisitionEpochMs   // Plus récent d'abord
    FIN SI
    RETOURNER compareStringsAsc(a.id, b.id)                     // Tie-break déterministe sans locale

FONCTION resolveDefaultVisualizationId(item: ComparisonItem) -> string | null :
    SI item.visualizations.length == 0 ALORS RETOURNER null
    SI item.defaultVisualizationId EST DÉFINI ET item.visualizations CONTIENT id == item.defaultVisualizationId ALORS
        RETOURNER item.defaultVisualizationId
    FIN SI
    RETOURNER item.visualizations[0].id
```

### 6.2 Auto-assignation « Par constellation » (RF-33, RF-34, CA-04)

```text
FONCTION assignByConstellation(items: ComparisonItem[], activePanels: PanelId[]) -> AutoAssignResult :
    N <- activePanels.length   // 2, 3 ou 4
    visItems <- filtrer items OÙ isVisualizable(item), triés par compareItemsMostRecentFirst

    // 1. Regroupement par constellation
    buckets <- Map<string, ComparisonItem[]>()
    POUR CHAQUE item DANS visItems FAIRE
        buckets[item.constellation].append(item)
    FIN POUR

    // 2. Sélection des constellations retenues si nbConstellations > N (RF-34, CA-04)
    // Critère de sélection des top-N : effectif décroissant, puis date la plus récente décroissante, puis ordre alphabétique
    allGroups <- liste des entrées (constellation, groupItems) de buckets
    TRIER allGroups SELON (gA, gB) :
        SI gA.items.length != gB.items.length ALORS
            RETOURNER gB.items.length - gA.items.length
        FIN SI
        maxEpochA <- gA.items[0].acquisitionEpochMs   // déjà trié plus récent en [0]
        maxEpochB <- gB.items[0].acquisitionEpochMs
        SI maxEpochA != maxEpochB ALORS
            RETOURNER maxEpochB - maxEpochA
        FIN SI
        RETOURNER compareStringsAsc(gA.constellation, gB.constellation)

    retainedGroups <- allGroups.slice(0, N)

    // 3. Ordre de remplissage de P1..PN parmi les constellations retenues :
    // « effectif décroissant puis ordre alphabétique » (cf. RF-34 & CA-04 : les 3 constellations de 2 items sont triées par ordre alphabétique dans P1..P3)
    TRIER retainedGroups SELON (gA, gB) :
        SI gA.items.length != gB.items.length ALORS
            RETOURNER gB.items.length - gA.items.length
        FIN SI
        RETOURNER compareStringsAsc(gA.constellation, gB.constellation)

    // 4. Construction du résultat réinitialisé (RF-33 : mode 'single' pour tous les items visualisables)
    itemModes <- { [item.id]: 'single' POUR item DANS visItems }
    panelAssignments <- { [p]: [] POUR p DANS ALL_PANEL_IDS }
    panelVisualizations <- { [p]: null POUR p DANS ALL_PANEL_IDS }

    POUR i DE 0 À retainedGroups.length - 1 FAIRE
        panelId <- activePanels[i]
        grpItems <- retainedGroups[i].items // déjà triés du plus récent au plus ancien
        panelAssignments[panelId] <- grpItems.map(it => it.id)
        panelVisualizations[panelId] <- resolveDefaultVisualizationId(grpItems[0])
    FIN POUR
    // Les panneaux surnuméraires (si retainedGroups.length < N) restent vides ;
    // Les items des constellations non retenues restent en mode 'single' non assignés.
    RETOURNER { itemModes, panelAssignments, panelVisualizations }
```

### 6.3 Auto-assignation « Par date / période d'acquisition » (RF-33, RF-35, CA-03)

Pour garantir simultanément :
1. **100 % des items visualisables assignés**,
2. **l'inséparabilité stricte** des items partageant la même date/heure d'acquisition,
3. **la minimisation de l'étalement temporel intra-groupe et la maximisation des écarts inter-groupes** (partitionnement optimal 1D de Fisher-Jenks / $k$-means exact par programmation dynamique),
4. **le rattachement de tout palier temporel équidistant au groupe le plus récent** (CA-03),
5. **le remplissage chronologique croissant** de `P1` (plus ancien) à `PN` (plus récent) :

```text
FONCTION assignByAcquisitionDate(items: ComparisonItem[], activePanels: PanelId[]) -> AutoAssignResult :
    N <- activePanels.length
    visItems <- filtrer items OÙ isVisualizable(item)
    itemModes <- { [item.id]: 'single' POUR item DANS visItems }
    panelAssignments <- { [p]: [] POUR p DANS ALL_PANEL_IDS }
    panelVisualizations <- { [p]: null POUR p DANS ALL_PANEL_IDS }

    SI visItems EST VIDE ALORS RETOURNER { itemModes, panelAssignments, panelVisualizations }

    // 1. Regroupement atomique des items de même timestamp d'acquisition (inséparables — RF-35)
    // Clé atomique = timestamp tronqué à la minute UTC (cohérent avec RF-04/RF-23 ; voir 03 § 6.6)
    slicesMap <- regrouper visItems par epochMin = floor(item.acquisitionEpochMs / 60000)
    slices <- entrées de slicesMap triées par epochMin CROISSANT   // slices[0] = plus ancien .. slices[M-1] = plus récent
    M <- slices.length
    K <- min(M, N)   // Nombre effectif de groupes non vides (si M < N, panneaux surnuméraires vides — RF-33)

    SI K == 1 ALORS
        clusters <- [ concaténer tous les slices ]
    SINON
        // 2. Coût intra-groupe exact SSE(a, b) d'un intervalle contigu slices[a..b] sur les paliers temporels
        //    (non pondéré par l'effectif de chaque palier, afin que la symétrie temporelle ne dépende pas
        //    du nombre d'items acquis à la même minute — CA-03).
        //    Calcul en minutes relatives entières (BigInt) et fractions exactes { num, den } : aucune perte IEEE-754.
        baseMin <- slices[0].epochMin
        POUR t DE 0 À M - 1 : x[t] <- BigInt(slices[t].epochMin - baseMin)

        POUR 0 <= a <= b < M :
            L <- BigInt(b - a + 1)
            S <- SOMME pour t de a à b de x[t]
            Q <- SOMME pour t de a à b de (x[t] * x[t])
            // SSE(a, b) = Q - S^2 / L = (L * Q - S^2) / L (fraction entière exacte >= 0)
            cost(a, b) <- reduceFraction({ num: L * Q - S * S, den: L })

        // 3. Programmation dynamique exacte en O(K * M^2) (M typiquement <= quelques centaines)
        //    dp[k][j] = coût minimal pour partitionner slices[0..j] en k groupes (1 <= k <= K)
        //    En cas d'égalité de coût (équidistance temporelle stricte : |t_m - center_left| == |center_right - t_m|),
        //    choisir la coupure `split` LA PLUS PETITE rattache l'élément médian au groupe de droite (le plus récent) !
        POUR j DE 0 À M - 1 : dp[1][j] <- cost(0, j) ; splitIdx[1][j] <- 0
        POUR k DE 2 À K :
            POUR j DE k - 1 À M - 1 :
                bestSplit <- k - 1
                bestCost <- addFraction(dp[k - 1][k - 2], cost(k - 1, j))
                // s est le premier indice du k-ième groupe (plus récent) : s va de k à j
                // Comparaison stricte par produit en croix (candidate.num * best.den < best.num * candidate.den) :
                // en cas d'égalité exacte on conserve le PLUS PETIT s, donc le groupe k (plus récent) absorbe le point médian !
                POUR s DE k À j :
                    candidateCost <- addFraction(dp[k - 1][s - 1], cost(s, j))
                    SI candidateCost.num * bestCost.den < bestCost.num * candidateCost.den ALORS
                        bestCost <- candidateCost
                        bestSplit <- s
                    FIN SI
                FIN POUR
                dp[k][j] <- bestCost
                splitIdx[k][j] <- bestSplit
            FIN POUR
        FIN POUR

        // 4. Remontée des K intervalles chronologiques [0..K-1]
        clusters <- tableau de taille K
        end <- M - 1
        POUR k DE K DOWNTO 1 :
            start <- splitIdx[k][end]
            clusters[k - 1] <- concaténer slices[start..end]
            end <- start - 1
        FIN POUR
    FIN SI

    // 5. Affectation chronologique croissante P1 (plus ancien) -> PK (plus récent)
    POUR i DE 0 À clusters.length - 1 FAIRE
        panelId <- activePanels[i]
        orderedCluster <- trier clusters[i] par compareItemsMostRecentFirst
        panelAssignments[panelId] <- orderedCluster.map(it => it.id)
        panelVisualizations[panelId] <- resolveDefaultVisualizationId(orderedCluster[0])
    FIN POUR

    RETOURNER { itemModes, panelAssignments, panelVisualizations }

// Helpers rationnels exacts (BigInt) :
// gcd(a, b)      := PGCD d'Euclide sur entiers >= 0
// reduceFraction := { num: f.num / g, den: f.den / g } avec g = gcd(f.num, f.den)
// addFraction    := reduceFraction({ num: p.num * q.den + q.num * p.den, den: p.den * q.den })
```
*Vérification sur CA-03* : `slices = [10/08 (x2), 20/08 (x1), 30/08 (x1)]`, $M = 3, K = 2$.
* Pour $s = 1$ (`P1 = [10/08 x2]`, `P2 = [20/08, 30/08]`) : $\text{cost}(0,0) + \text{cost}(1,2) = 0 + 50\text{ j}^2 = 50\text{ j}^2$.
* Pour $s = 2$ (`P1 = [10/08 x2, 20/08]`, `P2 = [30/08]`) : $\text{cost}(0,1) + \text{cost}(2,2) = 50\text{ j}^2 + 0 = 50\text{ j}^2$.
* Égalité stricte ($50 = 50$) $\rightarrow$ le parcours croissant conserve $s = 1$ $\rightarrow$ `P1` reçoit les 2 items inséparables du `10/08` et `P2` reçoit l'item équidistant du `20/08` avec celui du `30/08`. **CA-03 est vérifié exactement.**

### 6.4 Auto-assignation « Tous les items dans chaque panneau » (RF-36, CA-05)

```text
FONCTION assignAllToEachPanel(items: ComparisonItem[], activePanels: PanelId[]) -> AutoAssignResult :
    visItems <- filtrer items OÙ isVisualizable(item), triés par compareItemsMostRecentFirst
    itemModes <- { [item.id]: 'multi' POUR item DANS visItems }
    panelAssignments <- { [p]: [] POUR p DANS ALL_PANEL_IDS }
    panelVisualizations <- { [p]: null POUR p DANS ALL_PANEL_IDS }

    SI visItems EST NON VIDE ALORS
        allIds <- visItems.map(it => it.id)
        defaultVisId <- resolveDefaultVisualizationId(visItems[0])
        POUR CHAQUE panelId DANS activePanels FAIRE
            panelAssignments[panelId] <- allIds
            panelVisualizations[panelId] <- defaultVisId
        FIN POUR
    FIN SI
    RETOURNER { itemModes, panelAssignments, panelVisualizations }
```

### 6.5 Maintien et recalcul de la visualisation active d'un panneau (RF-18, RF-19, RF-20)

```text
FONCTION reconcilePanelVisualization(
    assignedItemsSortedMostRecentFirst: ComparisonItem[],
    previousVisualizationId: string | null
) -> string | null :
    SI assignedItemsSortedMostRecentFirst EST VIDE ALORS
        RETOURNER null                                           // Panneau vide (RF-07)
    FIN SI

    // Panneau précédemment vide -> initialisation (RF-18)
    SI previousVisualizationId == null ALORS
        RETOURNER resolveDefaultVisualizationId(assignedItemsSortedMostRecentFirst[0])
    FIN SI

    // Panneau déjà initialisé -> maintien tant qu'au moins 1 item du groupe supporte la visu active (RF-19)
    stillSupported <- EXISTE item DANS assignedItemsSortedMostRecentFirst
                      TEL QUE item.visualizations CONTIENT id == previousVisualizationId
    SI stillSupported ALORS
        RETOURNER previousVisualizationId
    FIN SI

    // Plus aucun item compatible restant -> bascule sur la visu par défaut du 1er item restant (RF-19, CA-09)
    RETOURNER resolveDefaultVisualizationId(assignedItemsSortedMostRecentFirst[0])
```

### 6.6 Calcul des métadonnées d'en-tête en UTC strict (RF-04, RF-22, RF-23, CA-08)

```text
FONCTION computeHeaderMetadata(renderedItems: ComparisonItem[], activeVis: VisualizationDescriptor) -> PanelHeaderMetadata | undefined :
    SI renderedItems EST VIDE ALORS RETOURNER undefined

    // 1. Constellations distinctes triées selon compareStringsAsc (RF-22)
    constellations <- liste unique triée par compareStringsAsc des item.constellation de renderedItems
    constellationsLabel <- constellations.join(', ')

    // 2. Date moyenne arithmétique stricte sur les timestamps exacts (RF-22, CA-08)
    sumEpochMs <- SOMME pour item DANS renderedItems DE item.acquisitionEpochMs
    meanEpochMs <- round(sumEpochMs / renderedItems.length)
    meanDateUtcLabel <- formatUtcMinute(meanEpochMs)

    // 3. Étendue temporelle conditionnelle Du ... au ... UTC (RF-23, CA-08)
    // Masquée si 1 seul item affiché ou si tous les items partagent exactement la même minute UTC
    temporalExtentUtcLabel <- null
    SI renderedItems.length > 1 ALORS
        minEpochMs <- MIN pour item DANS renderedItems DE item.acquisitionEpochMs
        maxEpochMs <- MAX pour item DANS renderedItems DE item.acquisitionEpochMs

        minMinuteKey <- floor(minEpochMs / 60000) * 60000
        maxMinuteKey <- floor(maxEpochMs / 60000) * 60000

        SI minMinuteKey != maxMinuteKey ALORS
            temporalExtentUtcLabel <- "Du " + formatUtcMinute(minEpochMs, false) + " au " + formatUtcMinute(maxEpochMs, true)
        FIN SI
    FIN SI

    RETOURNER {
        constellationsLabel: constellationsLabel,
        activeVisualizationLabel: activeVis.label,
        meanDateUtcLabel: meanDateUtcLabel,
        temporalExtentUtcLabel: temporalExtentUtcLabel
    }

FONCTION formatUtcMinute(epochMs: number, includeUtcSuffix: boolean = true) -> string :
    d <- nouvelle Date(epochMs)
    // Formatage strict 'JJ/MM/AAAA HH:mm UTC' (ou sans suffixe ' UTC' si includeUtcSuffix == false)
    jour <- pad2(d.getUTCDate())
    mois <- pad2(d.getUTCMonth() + 1)
    annee <- d.getUTCFullYear()
    heures <- pad2(d.getUTCHours())
    minutes <- pad2(d.getUTCMinutes())
    base <- jour + "/" + mois + "/" + annee + " " + heures + ":" + minutes
    RETOURNER SI includeUtcSuffix ALORS base + " UTC" SINON base
```
