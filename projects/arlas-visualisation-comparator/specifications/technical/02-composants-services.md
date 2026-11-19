# Spécification technique — Composants Angular et services

> **Référentiel source** : *Spécification fonctionnelle : Comparaison de visualisations d'imagerie (V1)* (`05-spec-comparaison-visu-raster-v1.md`).  
> **Voir aussi** : `00-index-adr.md` · `01-modele-etat.md` · `03-algorithmes.md` · `04-integration-maplibre.md` · `05-tests-tracabilite.md` · `06-questions-ouvertes.md`

---

## 3. Spécification par composant et service

### 3.1 Composants Angular (tous `standalone: true`, `ChangeDetectionStrategy.OnPush`)

#### 1. `ComparisonViewComponent` (`arlas-comparison-view`) — *Smart, Racine*
* **Rôle** : Conteneur plein écran autonome (RF-01). Instancie le scope d'injection de session (`ComparisonStore`, `MapSyncService`, `ItemLayerService`, `SwipeControlAdapter`), orchestre l'initialisation de l'état (restauration de `initialState` ou état par défaut RF-02/RF-03), expose l'export d'état (RF-39) et la fermeture (RF-01).
* **Dépendances injectées** : `ComparisonStore`, `ComparisonStateMapper`, `MapSyncService`.
* **RF couvertes** : RF-01, RF-02, RF-03, RF-37, RF-38, RF-39.
* **Contrat TypeScript** :
```typescript
@Component({
  selector: 'arlas-comparison-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ComparisonStore, MapSyncService, ItemLayerService, SwipeControlAdapter],
  host: {
    'class': 'arlas-comparison-view',
    'role': 'region',
    '[attr.aria-label]': 'ariaLabel()'
  }
  // ...
})
export class ComparisonViewComponent {
  /** Liste des items fournis par l'écran appelant (sélection amont ou résolus d'après initialState.itemIds), chacun porteur de ses visualisations pré-résolues */
  readonly items = input.required<readonly ComparisonItem[]>();

  /** Fonds de carte disponibles (le premier marqué isDefault ou l'élément 0 sert de défaut) */
  readonly basemaps = input.required<readonly BasemapDescriptor[]>();

  /** Configuration optionnelle de la source MNT pour la bascule Relief 3D / Vue 2D */
  readonly terrainConfig = input<TerrainDescriptor | undefined>(undefined);

  /** État de comparaison préétabli optionnel à restaurer à l'ouverture (RF-37, RF-38) */
  readonly initialState = input<ComparisonState | undefined>(undefined);

  /**
   * Affiche ou retire le critère « Par constellation » dans AutoAssignMenuComponent
   * (défaut: true ; passer false lorsque les items ne portent pas de constellation exploitable).
   */
  readonly enableConstellationAutoAssign = input<boolean>(true);

  /** Options d'affichage ARLAS optionnelles transmises à arlas-result-card-item (icônes, image par défaut, actions au survol) */
  readonly resultCardOptions = input<ResultListOptions | undefined>(undefined);
  /** Récupérateur optionnel de détails complémentaires par item pour arlas-result-card-item */
  readonly detailedDataRetriever = input<DetailedDataRetriever | undefined>(undefined);
  /** Autorise le chargement HTTP protégé des vignettes/quicklooks dans arlas-result-card-item (transmis tel quel à ItemCardComponent.useHttp) */
  readonly useHttp = input<boolean>(false);

  /** Libellé d'accessibilité du conteneur plein écran */
  readonly ariaLabel = input<string>('comparison.aria.view');

  /** Émis lorsque l'utilisateur clique sur « Exporter l'état » (RF-39) */
  readonly stateExported = output<ComparisonState>();

  /** Émis de façon non bloquante si l'état initial fourni a nécessité des replis/corrections (RF-38) */
  readonly stateRestoreWarnings = output<readonly StateRestoreWarning[]>();

  /** Émis lorsque l'utilisateur clique sur « Fermer » (RF-01) */
  readonly closed = output<void>();
}
```

#### 2. `ToolbarComponent` (`arlas-comparison-toolbar`) — *Dumb*
* **Rôle** : Barre globale supérieure regroupant le sélecteur exclusif des 4 dispositions, le curseur d'opacité globale (`0..100 %`), l'action « Exporter l'état » et l'action « Fermer ».
* **Dépendances** : Aucune (présentation pure, directives Angular Material / CDK + pipe de traduction).
* **RF couvertes** : RF-01, RF-08, RF-16, RF-39.
* **Contrat TypeScript** :
```typescript
export class ToolbarComponent {
  readonly activeLayout = input.required<LayoutMode>();
  /** Opacité globale entière en pourcentage [0..100] */
  readonly globalOpacity = input.required<number>();

  readonly layoutChange = output<LayoutMode>();
  readonly globalOpacityChange = output<number>();
  readonly exportStateClick = output<void>();
  readonly closeClick = output<void>();
}
```

#### 3. `AssignmentSidebarComponent` (`arlas-comparison-assignment-sidebar`) — *Smart*
* **Rôle** : Volet latéral gauche escamotable (RF-26) connectant la liste triée des items (RF-27) et le menu d'auto-assignation (RF-33..36, filtré selon `availableAutoAssignCriteria`) au `ComparisonStore` et à `MapSyncService` (pour l'action « Centrer sur l'item » RF-28).
* **Dépendances injectées** : `ComparisonStore`, `MapSyncService`.
* **RF couvertes** : RF-26, RF-27, RF-28, RF-29, RF-30, RF-31, RF-32, RF-33.
* **Contrat TypeScript** :
```typescript
export class AssignmentSidebarComponent {
  // Lit depuis ComparisonStore : sidebarOpen, itemCardsVm, layout, availableAutoAssignCriteria
  // Délègue au store : setSidebarOpen(), applyAutoAssignment(criterion), setItemAssignmentMode(), toggleItemPanelAssignment(), setHoveredItem()
  // Délègue à MapSyncService : fitBoundsAll(item.bbox) sur « Centrer sur l'item »
}
```

#### 4. `AutoAssignMenuComponent` (`arlas-comparison-auto-assign-menu`) — *Dumb*
* **Rôle** : Menu déroulant « Auto-assigner » exposant les critères déterministes actifs passés en entrée (`criteria`, soit par défaut `['constellation', 'acquisition-date', 'all-in-each']`, ou `['acquisition-date', 'all-in-each']` lorsque `ComparisonViewComponent.enableConstellationAutoAssign()` vaut `false`). Désactivé si aucun item fourni ne dispose d'au moins une visualisation ou si `criteria()` est vide.
* **Dépendances** : Aucune.
* **RF couvertes** : RF-33, RF-34, RF-35, RF-36.
* **Contrat TypeScript** :
```typescript
export class AutoAssignMenuComponent {
  readonly criteria = input<readonly AutoAssignCriterion[]>(DEFAULT_AUTO_ASSIGN_CRITERIA);
  readonly disabled = input<boolean>(false);
  readonly criterionSelected = output<AutoAssignCriterion>();
}
```

#### 5. `ItemCardComponent` (`arlas-comparison-item-card`) — *Dumb*
* **Rôle** : Carte composite à **deux étages verticaux** représentant un item dans le volet latéral :
  1. *Étage supérieur* : encapsule `ResultCardItemComponent` (`arlas-result-card-item` d'`arlas-components`, avec `showSelectionCheckbox = false`), affichant la vignette `100×100`, le titre, les lignes `CardField[][]` (dates en `JJ/MM/AAAA HH:mm UTC`), le volet optionnel de détails (`ResultDetailedItemComponent`) et relayant l'action `'arlas-comparison-center'` (`actionOnItemEvent`) vers `centerOnItem`.
  2. *Étage inférieur* : bandeau d'affectation contenant le commutateur `Choix unique / Multi-panneaux`, les badges d'état (*Aucune visualisation disponible*, incompatibilité RF-20, erreur RF-25) et `PanelAssignmentGridComponent`.
  * Déclenche la surbrillance d'emprise au survol/focus de l'ensemble de la carte composite (`mouseenter`/`mouseleave`/`focusin`/`focusout`).
* **Dépendances** : `ResultCardItemComponent`, `ResultDetailedItemComponent` (`arlas-components`, présentation), `PanelAssignmentGridComponent`.
* **RF couvertes** : RF-04, RF-20, RF-25, RF-27, RF-28, RF-29, RF-30, RF-31.
* **Contrat TypeScript** :
```typescript
export class ItemCardComponent {
  readonly itemVm = input.required<ItemCardViewModel>();
  readonly activeLayout = input.required<LayoutMode>();
  readonly cardOptions = input<ResultListOptions>(new ResultListOptions());
  readonly detailedDataRetriever = input<DetailedDataRetriever | undefined>(undefined);
  readonly useHttp = input<boolean>(false);

  readonly modeChange = output<AssignmentMode>();
  readonly panelToggle = output<PanelId>();
  readonly centerOnItem = output<void>();
  readonly cardHoverChange = output<boolean>();
}
```

#### 6. `PanelAssignmentGridComponent` (`arlas-comparison-panel-assignment-grid`) — *Dumb*
* **Rôle** : Grille miroir des boutons `[P1]..[PN]` reproduisant visuellement la disposition active (`[P1][P2]` sur 1 ligne pour `side-by-side` et `swipe`, `[P1][P2][P3]` sur 1 ligne pour `three-columns`, `[P1][P2]` / `[P3][P4]` sur 2 lignes pour `grid-2x2`), avec sémantique radio décochable en `single` et cases à cocher indépendantes en `multi`.
* **Dépendances** : Aucune.
* **RF couvertes** : RF-30, RF-32.
* **Contrat TypeScript** :
```typescript
export class PanelAssignmentGridComponent {
  readonly layout = input.required<LayoutMode>();
  readonly mode = input.required<AssignmentMode>();
  readonly selectedPanels = input.required<readonly PanelId[]>();
  readonly incompatiblePanels = input<readonly PanelId[]>([]);
  readonly erroredPanels = input<readonly PanelId[]>([]);
  readonly disabled = input<boolean>(false);

  readonly panelToggle = output<PanelId>();
}
```

#### 7. `MapAreaComponent` (`arlas-comparison-map-area`) — *Smart*
* **Rôle** : Zone cartographique globale orchestrant la disposition CSS des 2 à 4 `MapPanelComponent` en mode grille, ou — lorsque `layout === 'swipe'` — montant `MapPanelComponent` (`P1` plein cadre) dans `SwipeContainerComponent` avec les overlays d'en-tête/statut/légende de `P2` ancrés à droite et activant `SwipeControlAdapter` (`maplibre-gl-swipe`). Héberge l'unique instance de `SharedMapControlsComponent` et déclenche `mapSync.resizeAll()` lors des redimensionnements.
* **Dépendances injectées** : `ComparisonStore`, `MapSyncService`, `SwipeControlAdapter`.
* **RF couvertes** : RF-05, RF-08, RF-09, RF-10, RF-11, RF-12, RF-13, RF-14.
* **Contrat TypeScript** :
```typescript
export class MapAreaComponent {
  readonly basemaps = input.required<readonly BasemapDescriptor[]>();
  readonly terrainAvailable = input<boolean>(false);
}
```

#### 8. `SwipeContainerComponent` (`arlas-comparison-swipe-container`) — *Dumb*
* **Rôle** : Conteneur structurel de mise en page en mode Balayage : héberge le slot plein cadre du `MapPanelComponent` (`P1`, sur lequel `SwipeControl` de `maplibre-gl-swipe` injecte sa carte secondaire découpée et sa poignée `.swipe-slider`) et projette dans une couche supérieure non découpée les slots d'overlays de `P2` (`headerRight`, `statusRight`, `legendRight`) ancrés à droite en regard de ceux de `P1` ancrés à gauche (RF-09).
* **Dépendances** : Aucune.
* **RF couvertes** : RF-09, RF-10.
* **Contrat TypeScript** :
```typescript
export class SwipeContainerComponent {
  /** Indique si le panneau P2 affiche un indicateur de chargement non bloquant (RF-24) */
  readonly rightLoading = input<boolean>(false);
  /** Message d'erreur explicite si tous les items compatibles de P2 sont en échec (RF-25) */
  readonly rightErrorMessage = input<string | null>(null);
}
```

#### 9. `MapPanelComponent` (`arlas-comparison-map-panel`) — *Smart*
* **Rôle** : Héberge et pilote le cycle de vie de l'instance de carte du panneau `panelId` (soit via une instance `ARLAS-maplibre`, soit via un wrapper `maplibregl.Map` dédié — voir question ouverte 06 § 7), expose la référence `maplibregl.Map` sous-jacente à `MapSyncService` et `ItemLayerService`, relaie le survol géographique vers le store, et assemble `PanelHeaderComponent`, l'indicateur de progression non bloquant (RF-24), la bannière d'erreur totale (RF-25) et `PanelLegendComponent`.
* **Dépendances injectées** : `ComparisonStore`, `MapSyncService`, `ItemLayerService`, `DestroyRef`, `NgZone` (pour `runOutsideAngular` si Zone.js est présent).
* **RF couvertes** : RF-06, RF-07, RF-09, RF-13, RF-15, RF-16, RF-17, RF-21, RF-24, RF-25, RF-28.
* **Contrat TypeScript** :
```typescript
@Component({
  selector: 'arlas-comparison-map-panel',
  changeDetection: ChangeDetectionStrategy.OnPush
  // ...
})
export class MapPanelComponent {
  readonly panelId = input.required<PanelId>();
  /** Ancrage UI en mode Balayage : 'left' pour P1, 'right' pour P2, 'full' en Côte à côte */
  readonly overlayAnchor = input<'full' | 'left' | 'right'>('full');
}
```

#### 10. `PanelHeaderComponent` (`arlas-comparison-panel-header`) — *Dumb*
* **Rôle** : Affiche l'en-tête du panneau selon ses 4 états UI (les 3 états fonctionnels de Spec fonc. § 5.4 complétés de l'état transitoire de premier chargement, en correspondance avec la machine à états 01 § 4.2) :
  1. *Vide* (`'empty'` — `assignedCount === 0`) : *« Panneau Pn — Aucun item assigné »*, sans métadonnées ni sélecteur (RF-07).
  2. *Chargement initial* (`'loading-initial'` — `assignedCount > 0`, `displayedCount === 0` et au moins un item compatible en cours de chargement `'loading'`) : affiche le nom de la visualisation active et `VisualizationSelectorComponent`, en masquant temporairement les métadonnées calculées sur les items rendus tant qu'aucune source n'est `'loaded'` (RF-22, RF-24).
  3. *En échec total* (`'all-errored'` — `assignedCount > 0` et `displayedCount === 0` pour cause d'erreur de tous les items compatibles) : maintien du nom de la visualisation active et de `VisualizationSelectorComponent` (RF-25).
  4. *Actif* (`'active'` — `displayedCount >= 1`) : constellations, visualisation active, date moyenne UTC, étendue temporelle conditionnelle `Du ... au ... UTC` (RF-22, RF-23) et `VisualizationSelectorComponent` (RF-20).
* **Dépendances** : `VisualizationSelectorComponent`.
* **RF couvertes** : RF-04, RF-07, RF-09, RF-20, RF-22, RF-23, RF-25.
* **Contrat TypeScript** :
```typescript
export class PanelHeaderComponent {
  readonly panelId = input.required<PanelId>();
  readonly state = input.required<'empty' | 'active' | 'all-errored' | 'loading-initial'>();
  readonly metadata = input<PanelHeaderMetadata | undefined>(undefined);
  readonly activeVisualization = input<VisualizationDescriptor | undefined>(undefined);
  /** Entrées CogVisualisationData ('all' | 'partial') de l'union du panneau transmises à CogModalComponent */
  readonly modalVisualizations = input<readonly CogVisualisationData[]>([]);
  readonly anchor = input<'full' | 'left' | 'right'>('full');

  readonly visualizationChange = output<string>();
}
```

#### 11. `VisualizationSelectorComponent` (`arlas-comparison-visualization-selector`) — *Dumb*
* **Rôle** : Bouton d'action « Changer la visualisation » de l'en-tête de panneau qui ouvre la modale existante **`CogModalComponent` (`arlas-cog-modal` d'`arlas-components`)** via `MatDialog` en lui passant la liste des `CogVisualisationData` de l'union du groupe (`match: 'all' | 'partial'`, avec `selected: true` sur la visualisation active et affichage natif de l'alerte de compatibilité partielle CA-09), puis émet l'identifiant (`chosen.name`) à la fermeture de la modale.
* **Dépendances** : `MatDialog` (`@angular/material/dialog`), `CogModalComponent` (`arlas-components`).
* **RF couvertes** : RF-17, RF-20.
* **Contrat TypeScript** :
```typescript
export class VisualizationSelectorComponent {
  readonly visualizations = input.required<readonly CogVisualisationData[]>();
  readonly activeVisualizationName = input.required<string>();
  /** Émet le nom unique (VisualisationInterface.name) sélectionné dans CogModalComponent */
  readonly selected = output<string>();
}
```

#### 12. `PanelLegendComponent` (`arlas-comparison-panel-legend`) — *Smart Adapter Host*
* **Rôle** : Affiché uniquement si le panneau contient au moins un item affiché (masqué si panneau vide — RF-07, Spec fonc. § 5.4). Affiche l'échelle colorimétrique via **`CogLegendComponent` (`arlas-cog-legend` d'`arlas-components`)** lorsque `activeVisualization().legendConfig` comporte une palette (`colormapName` / `colormapUrl` + bornes `[min, max]` extraites de `colormap_name` et `rescale`), et s'appuie sur `RadiometricProbeAdapter` pour la lecture radiométrique au survol ou la mention normalisée **`« — »`** hors emprise / sans donnée / visualisation non sondable (RF-21 — modalité d'intégration de la sonde en question ouverte 06 § 7).
* **Dépendances injectées** : `RadiometricProbeAdapter` (fourni dans `providers: [RadiometricProbeAdapter]` de `PanelLegendComponent` afin que chaque panneau — y compris `P2` projeté dans `SwipeContainerComponent` lorsque `MapPanelComponent(P2)` est démonté en mode Balayage — dispose de sa propre instance sans `NullInjectorError`), ainsi que le composant enfant `CogLegendComponent`.
* **RF couvertes** : RF-07, RF-09, RF-21.
* **Contrat TypeScript** :
```typescript
@Component({
  selector: 'arlas-comparison-panel-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RadiometricProbeAdapter]
  // ...
})
export class PanelLegendComponent {
  readonly panelId = input.required<PanelId>();
  readonly activeVisualization = input.required<VisualizationDescriptor>();
  /** Pile ordonnée des items effectivement rendus dans ce panneau (sommet en index 0) */
  readonly renderedItemsTopDown = input.required<readonly ComparisonItem[]>();
  readonly hoveredLngLat = input<LngLatTuple | null>(null);
  readonly anchor = input<'full' | 'left' | 'right'>('full');
}
```

#### 13. `SharedMapControlsComponent` (`arlas-comparison-shared-map-controls`) — *Dumb*
* **Rôle** : Bloc unique de contrôles cartographiques mutualisés pour toute la zone cartographique (RF-14) : `Zoomer (+)`, `Dézoomer (-)`, `Boussole` (réinitialisation Nord + inclinaison), bascule `Relief 3D / Vue 2D` (affichée/active si `terrainAvailable`), et `Sélecteur de fond de carte`. Ne propose jamais le mode Globe (RF-15) ni de bouton de désynchronisation (RF-13).
* **Dépendances** : Aucune (*Note : peut encapsuler en option le `BasemapComponent` existant d'ARLAS si son contrat est compatible*).
* **RF couvertes** : RF-13, RF-14, RF-15.
* **Contrat TypeScript** :
```typescript
export class SharedMapControlsComponent {
  readonly bearing = input.required<number>();
  readonly pitch = input.required<number>();
  readonly terrainEnabled = input.required<boolean>();
  readonly terrainAvailable = input<boolean>(false);
  readonly basemaps = input.required<readonly BasemapDescriptor[]>();
  readonly activeBasemapId = input.required<string>();

  readonly zoomIn = output<void>();
  readonly zoomOut = output<void>();
  readonly resetNorth = output<void>();
  readonly terrainToggle = output<boolean>();
  readonly basemapChange = output<string>();
}
```

---

### 3.2 Services et logique métier pure

#### 1. `ComparisonStore` (scopé à `ComparisonViewComponent`)
* **Rôle** : Source unique de vérité basée sur Signals. Maintient la disposition, les affectations, les modes par item, les visualisations actives par panneau, les statuts de chargement/erreur des couches, l'opacité globale, l'état caméra/terrain/fond de carte, l'état du volet latéral et les états éphémères de survol (`hoveredItemId`, `hoveredLngLat`).
* **Dépendances** : `AutoAssignService`, `PanelMetadataService`, `ComparisonStateMapper`, `ResultCardItemMapper`, `PanelVisualizationService`.
* **RF couvertes** : RF-02, RF-03, RF-05..RF-12, RF-16..RF-20, RF-22..RF-39.
* **Signatures principales** :
```typescript
@Injectable()
export class ComparisonStore {
  // --- Signaux en lecture seule (exposés aux composants) ---
  readonly layout: Signal<LayoutMode>;
  readonly activePanelIds: Signal<readonly PanelId[]>;
  readonly swipePosition: Signal<number>;
  readonly globalOpacity: Signal<number>;
  readonly sidebarOpen: Signal<boolean>;
  readonly hoveredItemId: Signal<string | null>;
  readonly hoveredLngLat: Signal<LngLatTuple | null>;
  readonly camera: Signal<CameraState | null>;
  readonly terrainEnabled: Signal<boolean>;
  readonly activeBasemapId: Signal<string>;

  // --- Signaux calculés (computed) ---
  readonly availableAutoAssignCriteria: Signal<readonly AutoAssignCriterion[]>;
  readonly sortedItems: Signal<readonly ComparisonItem[]>;
  readonly itemCardsVm: Signal<readonly ItemCardViewModel[]>;
  readonly panelsVm: Signal<Readonly<Record<PanelId, PanelViewModel>>>;

  // --- Commandes / transitions ---
  initialize(
    items: readonly ComparisonItem[],
    basemaps: readonly BasemapDescriptor[],
    terrainConfig: TerrainDescriptor | undefined,
    initialState: ComparisonState | undefined
  ): readonly StateRestoreWarning[];

  setConstellationAutoAssignEnabled(enabled: boolean): void;
  setLayout(nextLayout: LayoutMode): void;
  setSwipePosition(pct: number): void;
  setGlobalOpacity(opacityPct: number): void;
  setSidebarOpen(open: boolean): void;
  setItemAssignmentMode(itemId: string, mode: AssignmentMode): void;
  toggleItemPanelAssignment(itemId: string, panelId: PanelId): void;
  setPanelVisualization(panelId: PanelId, visualizationId: string): void;
  applyAutoAssignment(criterion: AutoAssignCriterion): void;
  reportLayerStatus(panelId: PanelId, itemId: string, status: LayerLoadStatus, errorMsg?: string): void;
  setHoveredItem(itemId: string | null): void;
  setHoveredLngLat(lngLat: LngLatTuple | null): void;
  updateCameraFromSync(camera: CameraState): void;
  setTerrainEnabled(enabled: boolean): void;
  setActiveBasemap(basemapId: string): void;
  exportCurrentState(): ComparisonState;
}
```

#### 2. `AutoAssignService` (`providedIn: 'root'`, pur)
* **Rôle** : Implémente sous forme de fonctions pures et déterministes les 3 algorithmes d'auto-assignation (RF-33 à RF-36).
* **Dépendances** : Aucune.
* **RF couvertes** : RF-29, RF-33, RF-34, RF-35, RF-36.
* **Signatures** :
```typescript
export interface AutoAssignResult {
  readonly itemModes: Readonly<Record<string, AssignmentMode>>;
  readonly panelAssignments: Readonly<Record<PanelId, readonly string[]>>;
  readonly panelVisualizations: Readonly<Record<PanelId, string | null>>;
}

@Injectable({ providedIn: 'root' })
export class AutoAssignService {
  assignByConstellation(items: readonly ComparisonItem[], activePanels: readonly PanelId[]): AutoAssignResult;
  assignByAcquisitionDate(items: readonly ComparisonItem[], activePanels: readonly PanelId[]): AutoAssignResult;
  assignAllToEachPanel(items: readonly ComparisonItem[], activePanels: readonly PanelId[]): AutoAssignResult;
}
```

#### 3. `PanelMetadataService` (`providedIn: 'root'`, pur)
* **Rôle** : Calcule les métadonnées d'en-tête exclusivement sur les items compatibles et effectivement rendus sans erreur dans le panneau, et formate les dates en UTC strict (`JJ/MM/AAAA HH:mm UTC`).
* **Dépendances** : Aucune.
* **RF couvertes** : RF-04, RF-22, RF-23.
* **Signatures** :
```typescript
@Injectable({ providedIn: 'root' })
export class PanelMetadataService {
  computeHeaderMetadata(
    renderedItems: readonly ComparisonItem[],
    activeVisualization: VisualizationDescriptor
  ): PanelHeaderMetadata | undefined;

  formatUtcMinute(epochMs: number, includeUtcSuffix?: boolean): string;
}
```

#### 4. `ComparisonStateMapper` (`providedIn: 'root'`, pur)
* **Rôle** : Gère la migration de `schemaVersion`, la validation structurelle, la restauration tolérante non bloquante d'un `ComparisonState` externe (RF-37, RF-38) et la projection de l'état courant du store vers `ComparisonState` (RF-39).
* **Dépendances** : Aucune.
* **RF couvertes** : RF-37, RF-38, RF-39.
* **Signatures** :
```typescript
export interface ResolvedComparisonConfig {
  readonly layout: LayoutMode;
  readonly swipePosition: number;
  readonly sidebarItemIds: readonly string[]; // identifiants retenus pour le volet de gauche
  readonly itemModes: Record<string, AssignmentMode>;
  readonly panelAssignments: Record<PanelId, string[]>;
  readonly panelVisualizations: Record<PanelId, string | null>;
  readonly globalOpacity: number;
  readonly camera: CameraState | null; // null => déclenche l'auto-cadrage RF-02
  readonly initialBounds: GeoBoundingBox | null;
  readonly terrainEnabled: boolean;
  readonly basemapId: string;
  readonly sidebarOpen: boolean;
  readonly warnings: readonly StateRestoreWarning[];
}

@Injectable({ providedIn: 'root' })
export class ComparisonStateMapper {
  migrateIfNeeded(raw: unknown): { state: ComparisonState; warnings: StateRestoreWarning[] };

  fromExternalState(
    externalState: ComparisonState | undefined,
    availableItems: readonly ComparisonItem[],
    availableBasemaps: readonly BasemapDescriptor[],
    terrainAvailable: boolean
  ): ResolvedComparisonConfig;

  toExternalState(snapshot: RuntimeSerializableSnapshot): ComparisonState;
}
```

#### 5. `MapSyncService` (scopé à `ComparisonViewComponent`)
* **Rôle** : Registre des instances `maplibregl.Map` actives (`P1..P4`), synchronisation continue sans boucle infinie de la caméra, du fond de carte et du relief 3D, exécution des actions des contrôles mutualisés (`zoomIn`, `zoomOut`, `resetNorth`, `fitBounds`) et redimensionnement coordonné.
* **Dépendances** : `ComparisonStore`, `NgZone`.
* **RF couvertes** : RF-02, RF-13, RF-14, RF-15, RF-28.
* **Signatures** :
```typescript
@Injectable()
export class MapSyncService {
  registerMap(panelId: PanelId, map: maplibregl.Map): void;
  unregisterMap(panelId: PanelId): void;
  /** Enregistre/désenregistre la carte interne getComparisonMap() de maplibre-gl-swipe pour le terrain 3D et Mercator */
  setSwipeComparisonMap(comparisonMap: maplibregl.Map | null): void;
  fitBoundsAll(bbox: GeoBoundingBox, options?: { animate?: boolean; padding?: number }): void;
  applyCameraImmediate(camera: CameraState): void;
  zoomIn(): void;
  zoomOut(): void;
  resetNorthAndPitch(): void;
  applyBasemapToAll(basemap: BasemapDescriptor): void;
  applyTerrainToAll(terrain: TerrainDescriptor | undefined, enabled: boolean): void;
  resizeAll(): void;
}
```

#### 6. `ItemLayerService` (scopé à `ComparisonViewComponent`)
* **Rôle** : Réconcilie de façon différentielle les sources et couches raster d'un panneau selon la pile triée d'items compatibles et la visualisation active, ajuste `raster-opacity` sans recréer les sources, écoute les chargements/erreurs de tuiles par source, et maintient la couche GeoJSON supérieure de surbrillance d'emprise.
* **Dépendances** : Aucune (opère sur une instance `maplibregl.Map` passée en argument).
* **RF couvertes** : RF-06, RF-16, RF-20, RF-24, RF-25, RF-28.
* **Signatures** :
```typescript
@Injectable()
export class ItemLayerService {
  ensureOverlayAnchors(map: maplibregl.Map): void;
  syncPanelRasterStack(
    map: maplibregl.Map,
    panelId: PanelId,
    orderedCompatibleItemsBottomUp: readonly ComparisonItem[],
    visualization: VisualizationDescriptor | null,
    opacityRatio: number,
    onItemStatusChange: (itemId: string, status: LayerLoadStatus, err?: string) => void
  ): void;
  updateRasterOpacity(map: maplibregl.Map, panelId: PanelId, opacityRatio: number): void;
  updateHighlightedFootprint(map: maplibregl.Map, item: ComparisonItem | null): void;
}
```

#### 7. `RadiometricProbeAdapter` (scopé à `PanelLegendComponent`)
* **Rôle** : Adaptateur isolant la logique locale de survol et le contrat de lecture radiométrique (composant vivant aujourd'hui dans une application parente — voir 00 § ADR-04 et 06 § 7 Q2). Résout à chaque mouvement de curseur l'item compatible et valide situé au sommet de la pile contenant géométriquement la coordonnée survolée, applique le debounce/annulation et traduit la sortie vers le contrat d'affichage de `PanelLegendComponent` (incluant `« — »` hors emprise / NoData et le fonctionnement à opacité 0 %).
* **RF couvertes** : RF-21 (CA-10). *(Détaillé en 04 § 5.5).*

#### 8. `SwipeControlAdapter` (scopé à `ComparisonViewComponent`)
* **Rôle** : Encapsule le cycle de vie et la synchronisation de `SwipeControl` (`maplibre-gl-swipe`) en mode *headless* sur la carte `P1` lorsque `layout() === 'swipe'`. Relie bidirectionnellement la position de la poignée (`slide` / `setPosition`) à `ComparisonStore.swipePosition`, configure `leftLayers` (`P1`) et `rightLayers` (`P2`) avec préservation du fond de carte (`basemapLayerIds` + `'__basemap__'`), expose `swipeControl.getComparisonMap()` à `ItemLayerService` et `MapSyncService` pour synchroniser la pile raster `P2`, son opacité, ses événements `sourcedata`/`error`, la surbrillance d'emprise et le relief 3D, et enrichit `.swipe-slider-handle` pour l'accessibilité clavier ARIA.
* **Dépendances** : `ComparisonStore`, `MapSyncService`, `ItemLayerService`, `NgZone`, `DestroyRef`.
* **RF couvertes** : RF-06, RF-07, RF-09, RF-10, RF-13, RF-15, RF-16, RF-24, RF-25, RF-28.
* **Signatures** :
```typescript
@Injectable()
export class SwipeControlAdapter {
  attach(hostMapP1: maplibregl.Map, basemapLayerIds: readonly string[]): void;
  detach(): void;
  setPosition(positionPct: number): void;
  syncSwipePanels(
    p1ItemsBottomUp: readonly ComparisonItem[],
    p1Vis: VisualizationDescriptor | null,
    p2ItemsBottomUp: readonly ComparisonItem[],
    p2Vis: VisualizationDescriptor | null,
    opacityRatio: number
  ): void;
  handleBasemapStyleReload(basemapLayerIds: readonly string[]): void;
}
```

#### 9. `ResultCardItemMapper` (`providedIn: 'root'`, pur)
* **Rôle** : Construit ou adapte de façon déterministe une instance `Item` du modèle `arlas-components` à partir d'un `ComparisonItem` afin d'alimenter `arlas-result-card-item` :
  * si `comparisonItem.arlasItem` est déjà fourni par l'application parente, clone ses métadonnées sans muter l'instance d'origine et garantit la présence de l'action `'arlas-comparison-center'` (« Centrer sur l'item ») dans `item.actions` ;
  * sinon, génère par défaut un `Item` ARLAS avec `urlThumbnail`, un `CardField` de titre (`id`) et les lignes `CardField[][]` de métadonnées disponibles (`acquisitionEpochMs` formaté en `JJ/MM/AAAA HH:mm UTC` via `PanelMetadataService`, `constellation`, et optionnellement `sensor` / `cloudCover` en `%`).
* **Dépendances** : `PanelMetadataService`.
* **RF couvertes** : RF-04, RF-27, RF-28.
* **Signatures** :
```typescript
export const COMPARISON_CENTER_ACTION_ID = 'arlas-comparison-center' as const;

@Injectable({ providedIn: 'root' })
export class ResultCardItemMapper {
  toArlasResultItem(item: ComparisonItem, position: number): Item;
}
```

#### 10. `PanelVisualizationService` (`providedIn: 'root'`, pur)
* **Rôle** : Calcule de manière pure et déterministe, pour chaque panneau `Pn`, l'union ordonnée des visualisations disponibles à partir des `item.visualizations` pré-fournies sur les items assignés au panneau, et construit le tableau `CogVisualisationData[]` destiné à `CogModalComponent` (`match: 'all'` si tous les items assignés à `Pn` supportent la visualisation, `'partial'` si seul un sous-ensemble la supporte — CA-09 — en excluant `'none'` pour respecter l'union RF-20).
* **Dépendances** : Aucune.
* **RF couvertes** : RF-17, RF-18, RF-19, RF-20, RF-29.
* **Signatures** :
```typescript
@Injectable({ providedIn: 'root' })
export class PanelVisualizationService {
  computePanelUnion(
    assignedItemsTopDown: readonly ComparisonItem[]
  ): readonly VisualizationDescriptor[];

  buildPanelModalData(
    assignedItemsTopDown: readonly ComparisonItem[],
    activeVisualizationId: string | null
  ): readonly CogVisualisationData[];
}
```
