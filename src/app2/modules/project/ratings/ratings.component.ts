import { HttpClient } from '@angular/common/http';
import {
  Component,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import { RouterService } from 'src/app2/services/router.service';
import { UtilsService } from 'src/app2/services/utils.service';
import {
  diligenceStatusConstant,
  headerConstants,
  keywordConstants,
  ratingConstants,
  ratingLevels,
  responseStatus,
} from 'src/app2/shared/constants/constant';
import * as d3 from 'd3';
import { SweetAlertService } from 'src/app2/services/sweet-alert.service';
import swal from 'sweetalert2/dist/sweetalert2.js';
import { finalize, takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { ProjectSummaryService } from 'src/app2/services/project-summary.service';
import { CustomFieldsService } from 'src/app2/services/custom-fields.service';
import { Select } from '@ngxs/store';
import { UserState } from 'src/app2/store/user/user.state';
import { take } from 'rxjs/operators';
import { IRatingScaleDefinition } from 'src/app2/shared/components/heatmap/heatmap.type';
import { RatingScalesService } from 'src/app2/services/rating-scales/rating-scales.service';
import { CustomModalService } from 'src/app2/services/modal/customModal.service';
import { AutoScrollServiceService } from 'src/app2/services/auto-scroll-service.service';
import { DvRatingComponent } from 'src/app2/shared/components';
import { EditableOnlyScoreComponent } from 'src/app2/shared/components/editable-only-score/editable-only-score.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-ratings',
  templateUrl: './ratings.component.html',
  styleUrls: ['./ratings.component.css'],
})
export class RatingsComponent implements OnInit, OnDestroy {
  is_admin: boolean;
  diligenceTypeId: number;
  current_user: any;
  heatmap_options: { heatmap_orientation: string; invertColor: boolean };
  defaultVersion: number;
  view_mode: string;
  loading: boolean;
  ratingChanged: boolean;
  diligence: any;
  dueDiligenceID: number;
  entity_id: number;
  entity_type: string;
  rating_types: any;
  selectedRatingType: any;
  selectedRatingTypeBackup: any;
  firm_preferences: any;
  reviewEnabled: boolean;
  ratingsNotEditable: boolean;
  diligenceStatusConstant = diligenceStatusConstant;
  keywordConstants = keywordConstants;
  headerConstants = headerConstants;
  responseStatus = responseStatus;
  ratingLevels = ratingLevels;
  ratingLevel: string;
  ratings: any;
  ratingsBackup: any[];
  ratingMappedToTemplate: boolean;
  entityFunctions: any;
  myFunctions: any;
  ratingConstants = ratingConstants;
  finalScoreColorCode: any;
  heatmapResponse: any;
  custom_fields = [];
  diligenceType: any;
  @Select(UserState.getCurrentUserData) user;
  @Select(UserState.getFirmPreferenceData) firmPref;
  @ViewChildren(DvRatingComponent) dvRatings: QueryList<DvRatingComponent>;
  @ViewChildren(EditableOnlyScoreComponent)
  dvScores: QueryList<EditableOnlyScoreComponent>;
  mainRatingScaleId: number;
  ratingScaleDetailsMap: Map<number, any> = new Map<number, any>(); // map of rating scale id VS scale data
  ratingDefinitionScaleIdMap: Map<number, number> = new Map<number, number>(); // map of rating definition id VS rating scale id
  finalScoreScaleName: string;
  heatmapColor: Map<number, IRatingScaleDefinition[]> = new Map<
    number,
    IRatingScaleDefinition[]
  >();
  categoryId: number = null;
  ngUnsubscribe = new Subject<void>();
  disableRatings: boolean;

  constructor(
    private readonly route: RouterService,
    private readonly Utils: UtilsService,
    private readonly http: HttpClient,
    private readonly SweetAlert: SweetAlertService,
    private readonly ModalFactory: CustomModalService,
    private readonly toaster: ToastrService,
    private readonly projectSummaryService: ProjectSummaryService,
    private readonly customFieldsService: CustomFieldsService,
    private readonly autoScroll: AutoScrollServiceService,
    private readonly RatingScalesService: RatingScalesService,
    private routeState: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.diligenceTypeId = 1105;
    this.heatmap_options = {
      heatmap_orientation: 'X',
      invertColor: false,
    };
    this.defaultVersion = 0;
    this.view_mode = 'tabbed';
    this.loading = true;
    this.ratingChanged = false;
    setTimeout(() => {
      this.categoryId = this.route.getState().params?.categoryId;
    }, 0);
    this.autoScroll.afterScrollEvent
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((value) => {
        if (value) {
          this.categoryId = null;
        }
      });
    this.dueDiligenceID = parseInt(this.route.getState().params.diligenceId);
    this.user.pipe(take(1)).subscribe((data) => {
      if (data) {
        this.current_user = data;
        this.is_admin = data.isAdmin;
        this.getRatingsData();
      }
    });
  }

  getRatingsData() {
    this.projectSummaryService
      .getCurrentDiligence(this.dueDiligenceID, this.current_user)
      .subscribe((diligence: any) => {
        this.diligence = diligence;
        this.entity_id = diligence.entity_id;
        this.entity_type = diligence.entity_type;
        this.diligenceType = diligence.diligence_type;
        if (this.current_user && this.current_user.firmInfo) {
          let permissions_enabled =
            this.current_user.firmInfo.hasPermissionEnabled;
          if (permissions_enabled) {
            this.diligence.hasReadOnlyAccess = false;
          } else {
            this.diligence.isLocked =
              this.diligence.isLocked || this.diligence.hasReadOnlyAccess;
          }
        }

        const observables = [];
        observables.push(this.getDefaultRatingScheme());
        observables.push(this.loadRatingSchemes());

        forkJoin(observables).subscribe((response: {}) => {
          const selectedRatingSchemeID = response[0]
            ? response[0].rating_scheme_id
            : null;
          this.rating_types = response[1];
          const selectedRatingType = this.rating_types.find(
            (type) => type.id === selectedRatingSchemeID
          );
          this.loading = false;
          if (selectedRatingType) {
            this.selectedRatingType = selectedRatingType;
            this.selectedRatingTypeBackup = selectedRatingType;
            this.ratingLevel =
              this.selectedRatingType.rating_level.toLowerCase();
            this.mainRatingScaleId = this.selectedRatingType.rating_scale_id;
            this.loadRatings(selectedRatingSchemeID);
          }
        });
        this.getFirmPref();
      });
  }

  getCurrentDiligence() {
    return this.http.get(`diligences/${this.dueDiligenceID}`);
  }

  getDefaultRatingScheme() {
    const params = {
      entity_id: this.dueDiligenceID,
      entity_type: 'DueDiligence',
    };
    return this.http.get('rating_scheme_defaults', { params: params });
  }

  loadRatingSchemes() {
    const params = {
      duediligence_id: this.dueDiligenceID,
    };
    return this.http.get('rating_types', { params: params });
  }

  getFirmPref() {
    this.firmPref.pipe(take(2)).subscribe((response) => {
      if (response) {
        this.firm_preferences = response;
        this.reviewEnabled =
          this.firm_preferences.enable_rating_custom_fields_review &&
          this.diligence.status ===
            this.diligenceStatusConstant.PRECOMPLETIONREVIEW;
        this.ratingsNotEditable =
          this.diligence.diligence_type === 'dd_review' &&
          this.firm_preferences.enable_rating_custom_fields_review &&
          (this.diligence.status === this.diligenceStatusConstant.COMPLETED ||
            this.diligence.status ===
              this.diligenceStatusConstant.POSTCOMPLETIONREVIEW);
        this.disableRatings =
          this.diligence.isLocked || this.ratingsNotEditable;

        if (response.enable_yaxis_entity) {
          this.heatmap_options.heatmap_orientation = 'Y';
        }

        if (response.invert_color) {
          this.heatmap_options.invertColor = response.invert_color;
        }
      }
    });
  }

  loadRatings(id: any) {
    const observables = [];
    observables.push(
      this.http.get(
        `v2/rating_scales/${this.selectedRatingType.rating_scale_id}/versions/${this.selectedRatingType.rating_scale_version}/rating_scale_definitions`
      )
    );
    observables.push(
      this.http.get(
        `templates/${this.diligence.template_id}/versions/${this.diligence.template_version}/TemplateRatingSchemeMappings`
      )
    );

    const ratingProfileParams: any = {
      entity_id: this.dueDiligenceID,
      entity_type: 'DueDiligence',
    };
    if (id) {
      ratingProfileParams.rating_scheme_id = id;
      this.getCustomFields(id);
    }
    observables.push(
      this.http.get('ratings/profile', { params: ratingProfileParams })
    );

    let functionParams: { entity_type: any; entity_id: any };
    if (this.diligence.entity_type === 'Review') {
      functionParams = {
        entity_type: this.keywordConstants.Project,
        entity_id: this.diligence.id,
      };
    } else {
      functionParams = {
        entity_type: this.diligence.entity_type,
        entity_id: this.diligence.entity_id,
      };
    }
    observables.push(
      this.http.get('function_assignments', { params: functionParams })
    );

    observables.push(
      this.http.get(`diligences/${this.diligence.id}/MyFunctions`)
    );

    this.loading = true;
    forkJoin(observables).subscribe((responses: Array<any>) => {
      if (!responses[0].length) {
        this.toaster.error('rating scale is not available');
        this.loading = false;
        return;
      }
      this.setScaleValues(responses[0]); // rating scale API
      if (responses[1] && responses[1].length) {
        // mapping API
        const mappings = responses[1];
        if (this.selectedRatingType.id === mappings[0].rating_scheme_id) {
          this.ratingMappedToTemplate = true;
        } else {
          this.ratingMappedToTemplate = false;
        }
      } else {
        this.ratingMappedToTemplate = false;
      }
      this.ratings = responses[2]; // rating profile API
      this.entityFunctions = responses[3]; // functions API
      this.myFunctions = responses[4]; // myFunctions API
      this.getSecondaryRatingScales(); // each level can have diff scales so map and get info for missing scales
      this.ratingsBackup = [...this.ratings];
      this.ratingChanged = false;
    });
  }

  setScaleValues(rating_scales) {
    const noValueIndex = rating_scales.findIndex(
      (scale) => parseInt(scale.value) === this.ratingConstants.naValue
    );
    let naValue: any, notRatedValue: any;
    if (noValueIndex > -1) {
      naValue = rating_scales[noValueIndex];
      rating_scales.splice(noValueIndex, 1);
    }
    const notRatedValueIndex = rating_scales.findIndex(
      (scale) => parseInt(scale.value) === this.ratingConstants.notRatedValue
    );
    if (notRatedValueIndex > -1) {
      notRatedValue = rating_scales[notRatedValueIndex];
      rating_scales.splice(notRatedValueIndex, 1);
    }
    let maxScore: number;
    if (rating_scales.length === 1) {
      maxScore = 5;
    } else {
      maxScore = rating_scales.length;
    }
    const scaleData = {
      naValue: naValue,
      notRatedValue: notRatedValue,
      rating_scales: rating_scales,
      maxScore: maxScore,
    };
    this.ratingScaleDetailsMap.set(rating_scales[0].rating_scale_id, scaleData);
  }

  getSecondaryRatingScales() {
    const observables = [];
    // for each definition, create a map of definition id VS rating scale id
    this.ratings.forEach((category: any) => {
      this.assignRatingScaleToDefinition(category);
      category.ratings.forEach((subcategory: any) => {
        this.assignRatingScaleToDefinition(subcategory);
        subcategory.ratings?.forEach((question: any) => {
          this.assignRatingScaleToDefinition(question);
        });
      });
    });

    // forkjoin of all required rating scale definitions API
    this.ratingScaleDetailsMap.forEach((value: any, key: number) => {
      if (!value) {
        // only fetch definitions which are not available
        observables.push(
          this.http.get(
            `v2/rating_scales/${key}/versions/0/rating_scale_definitions`
          )
        );
      }
    });

    // get rating scale definitions for project level if the scale is different
    if (this.selectedRatingType.project_level_rating_scale_id) {
      if (
        !this.ratingScaleDetailsMap.has(
          this.selectedRatingType.project_level_rating_scale_id
        )
      ) {
        observables.push(
          this.http.get(
            `v2/rating_scales/${this.selectedRatingType.project_level_rating_scale_id}/versions/0/rating_scale_definitions`
          )
        );
      }
    }

    if (observables.length) {
      forkJoin(observables).subscribe((responses: Array<any>) => {
        responses?.forEach((rating_scales) => {
          this.setScaleValues(rating_scales);
        });
        this.setColorCodes();
        this.loading = false;
      });
    } else {
      this.setColorCodes();
      this.loading = false;
    }
  }

  assignRatingScaleToDefinition(ratingDefinition) {
    if (!ratingDefinition.rating_scale_id) {
      // if there is no rating scale id present, assign the main rating scale id to this definition
      this.ratingDefinitionScaleIdMap.set(
        ratingDefinition.id,
        this.mainRatingScaleId
      );
    } else {
      this.ratingDefinitionScaleIdMap.set(
        ratingDefinition.id,
        ratingDefinition.rating_scale_id
      );
      if (!this.ratingScaleDetailsMap.has(ratingDefinition.rating_scale_id)) {
        // if scale id is not present in the rating scale details map, add that scale id to map with null value
        this.ratingScaleDetailsMap.set(ratingDefinition.rating_scale_id, null);
      }
    }
  }

  setColorCodes() {
    this.ratings.forEach((category: any) => {
      category.ratings.forEach((subcategory: any) => {
        subcategory.ratings?.forEach((question: any) => {
          this.assignColorToRating(question);
        });
        this.assignColorToRating(subcategory);
      });
      this.assignColorToRating(category);
    });

    this.assignScaleNameAndColorToFinalRating();
  }

  assignScaleNameAndColorToFinalRating() {
    // for project level score/rating
    const ratingScale = this.ratingScaleDetailsMap.get(
      this.selectedRatingType.project_level_rating_scale_id ??
        this.mainRatingScaleId
    );

    if (
      Math.round(this.diligence.total_rating) ===
      this.ratingConstants.notRatedValue
    ) {
      this.finalScoreScaleName = ratingScale.notRatedValue.name;
      const fore_color = this.Utils.pickTextColorBasedOnBgColorAdvanced(
        ratingScale.notRatedValue.color_code
      );
      this.finalScoreColorCode = {
        color: fore_color,
        'background-color': ratingScale.notRatedValue.color_code,
      };
    } else {
      this.finalScoreScaleName = ratingScale.rating_scales.find(
        (x) => x.value === Math.round(this.diligence.total_rating)
      )?.name;
      this.finalScoreColorCode = this.Utils.getColorCodeFromDomain(
        this.diligence.total_rating,
        this.getColorScaleUsingD3Library(ratingScale)
      );
    }
  }

  assignColorToRating(ratingDefinition) {
    const ratingScale = this.ratingScaleDetailsMap.get(
      this.ratingDefinitionScaleIdMap.get(ratingDefinition.id)
    );

    if (ratingDefinition.rating_value) {
      ratingDefinition.color_code = this.Utils.getColorCodeFromDomain(
        ratingDefinition.rating_value,
        this.getColorScaleUsingD3Library(ratingScale)
      );
    } else if (ratingDefinition.is_na) {
      const notRatedValue = ratingScale.notRatedValue;
      const fore_color = this.Utils.pickTextColorBasedOnBgColorAdvanced(
        notRatedValue.color_code
      );
      ratingDefinition.color_code = {
        color: fore_color,
        'background-color': notRatedValue.color_code,
      };
    } else {
      const naValue = ratingScale.naValue;
      const fore_color = this.Utils.pickTextColorBasedOnBgColorAdvanced(
        naValue.color_code
      );
      ratingDefinition.color_code = {
        color: fore_color,
        'background-color': naValue.color_code,
      };
    }
  }

  getColorScaleUsingD3Library(ratingScale) {
    const scaleArray = [...Array(ratingScale.maxScore).keys()].map(
      (x) => x + 1
    );
    const colorScheme = ratingScale.rating_scales.map((x) => x.color_code);
    const colorScale = d3.scaleLinear().domain(scaleArray).range(colorScheme);
    return colorScale;
  }

  onSelectedRatingChange(newValue: { id: any }) {
    //If a previous value exists for the rating type then show confirm before proceeding.
    if (newValue && this.selectedRatingTypeBackup != null) {
      this.SweetAlert.confirm({
        title: 'Are you sure you want to change this rating?',
        text: 'Your previous ratings will be deleted',
        showLoaderOnConfirm: true,
        focusCancel: true,
        preConfirm: () => {
          return new Promise<void>((resolve) => {
            this.postRatingType(newValue.id, resolve);
            this.selectedRatingTypeBackup = newValue;
            this.ratingLevel =
              this.selectedRatingType.rating_level.toLowerCase();
            this.diligence.total_score = null;
          });
        },
      }).then((res) => {
        if (res.isDismissed) {
          this.selectedRatingType = this.selectedRatingTypeBackup;
          swal.close();
        }
      });
      //else change the value directly
    } else if (newValue) {
      this.postRatingType(newValue.id);
      this.selectedRatingTypeBackup = newValue;
      this.ratingLevel = this.selectedRatingType.rating_level.toLowerCase();
      this.diligence.total_score = null;
    }
  }

  postRatingType(id: any, resolve = null) {
    const params = {
      rating_scheme_id: id,
      entity_id: this.dueDiligenceID,
      entity_type: 'Duediligence',
    };

    this.http
      .put('rating_scheme_defaults', params)
      .pipe(
        finalize(() => {
          if (resolve) {
            resolve();
          }
        })
      )
      .subscribe((response: any) => {
        this.mainRatingScaleId = this.selectedRatingType.rating_scale_id;
        this.loadRatings(id);
      });
  }

  loadHeatMap() {
    this.loading = true;
    this.getRatingScalesDataForHeatMap();
  }

  getRatingScalesDataForHeatMap() {
    this.RatingScalesService.getRatingScaleDefinitionsByRatingScheme(
      this.selectedRatingType.id
    ).subscribe(
      (response) => {
        Object.keys(response).forEach((key) => {
          this.heatmapColor.set(parseInt(key), response[key]);
        });
        this.getHeatmapResponse();
      },
      (e) => {
        this.loading = true;
      }
    );
  }

  getHeatmapResponse() {
    const params = {
      entity_ids: {
        duediligence: [this.dueDiligenceID],
      },
      include_portfolio: false,
    };
    this.http
      .post(
        `rating_schemes/${this.selectedRatingType.id}/rating_scores_analysis`,
        params
      )
      .subscribe(
        (response: any) => {
          this.heatmapResponse = response;
          this.loading = false;
        },
        (e) => {
          this.loading = false;
        }
      );
  }

  recalculateScores() {
    const payload = {
      duediligence_ids: [this.dueDiligenceID],
    };
    this.http
      .post(`diligences/recalculate_score`, payload)
      .subscribe((response: any) => {
        this.diligence.recalculation_needed = false;
        this.getCurrentDiligence().subscribe((diligence: any) => {
          this.diligence = diligence;
          if (this.view_mode === 'tabbed') {
            this.loadRatings(this.selectedRatingType.id);
          } else {
            this.getHeatmapResponse();
          }
        });
      });
  }

  reloadScores() {
    this.getCurrentDiligence().subscribe((diligence: any) => {
      this.diligence = diligence;
      this.loadRatings(this.selectedRatingType.id);
      this.ratingChanged = false;
    });
  }

  toggleNARating(rating: any, subcategory: any, category: any, mode: any) {
    rating.is_na = !rating.is_na;
    if (rating.is_na) {
      if (mode === ratingConstants.Absolute) {
        const ratingComponents = this.dvRatings.toArray();
        const ratingComponent = ratingComponents.find(
          (x) => x.id === rating.id
        );
        if (ratingComponent) {
          ratingComponent.resetRating();
        }
      } else if (mode === ratingConstants.ScoreBand) {
        const scoreComponents = this.dvScores.toArray();
        const scoreComponent = scoreComponents.find((x) => x.id === rating.id);
        if (scoreComponent) {
          scoreComponent.resetScore();
        }
      }
    }
    this.onChangeRatingValue(null, rating, subcategory, category, mode);
  }

  onChangeRatingValue(
    value: number,
    rating: any,
    subcategory: any,
    category: any,
    mode: any,
    view_mode: any = null
  ) {
    const ratingClone = { ...rating };
    if (mode === ratingConstants.Absolute) {
      ratingClone.rating_value = value;
    } else {
      ratingClone.score_value = value;
    }
    this.openCustomFieldModal(
      ratingClone,
      subcategory,
      category,
      mode,
      view_mode
    );
  }

  onScorebandIconClick(
    value: number,
    rating: any,
    subcategory: any,
    category: any,
    mode: any,
    view_mode: any = null
  ) {
    if (!this.custom_fields?.length && !this.reviewEnabled) {
      // if modal is not going to get opened, icon click should do nothing
      return;
    }
    this.onChangeRatingValue(
      value,
      rating,
      subcategory,
      category,
      mode,
      view_mode
    );
  }

  bulkMarkQuestionsAsNA(subCat: any) {
    if (subCat.is_na) {
      // reverse action is not allowed
      return;
    }
    subCat.is_na = true;
    const params = {
      entity_id: this.dueDiligenceID,
      entity_type: 'Duediligence',
      ratingCategoryID: subCat.id,
    };

    this.http
      .put('ratings/bulk_mark_questions_as_na', params)
      .subscribe((response: any) => {
        this.toaster.success(
          'All the questions under this sub-category have been marked as N/A. Please click on "Reload Scores" to see the updated values.'
        );

        setTimeout(() => {
          this.ratingChanged = true;
        }, 2000);
      });
  }

  getCustomFields(id: any) {
    const params = {
      schema_type: 'rating',
      entity_id: id,
    };
    this.customFieldsService
      .getCustomFields(params)
      .subscribe((response: any) => {
        this.custom_fields = response.custom_fields.rating;
      });
  }

  openCustomFieldModal(
    rating: any,
    subcategory: any,
    category: any,
    mode: any,
    view_mode: any
  ) {
    if (!rating.is_na && (this.custom_fields?.length || this.reviewEnabled)) {
      const attributes = this.setRatingAttributesForModal(
        rating,
        mode,
        category,
        subcategory
      );
      this.ModalFactory.invoke('manage-ratings', {
        initialState: {
          entityType: this.diligenceTypeId,
          entityId: this.dueDiligenceID,
          subEntityId: rating.id,
          rating: attributes.newRating,
          readonly: this.disableRatings,
          ratingScales: attributes.rating_scale,
          naValue: attributes.naValue,
          enableReview:
            this.reviewEnabled &&
            attributes.selectedRating.rating_value != null,
          enable_tracking: this.firm_preferences.enable_track_changes,
          functions: this.entityFunctions,
          assignedFunctions: this.myFunctions,
          diligenceType: this.diligenceType,
          response: (response: any) => {
            rating.rating_status = response.rating.attributes.rating_status;
            if (response.rating.verifier) {
              rating.review_assignments[0] =
                response.rating.verifier.attributes;
            }
            if (response.cancelClick) {
              // if user is closing the modal, return without updating score and custom fields
              return;
            }
            rating.rating_value = response.rating.attributes.rating_value;
            rating.score_value = response.rating.attributes.score_value;
            if (!view_mode) {
              this.recordRating(rating, subcategory, category);
            }
            this.saveCustomFields(rating, response.customFields);
          },
        },
        class: 'gray modal-lg',
      });
    } else {
      if (this.disableRatings) {
        return;
      }
      this.recordRating(rating, subcategory, category);
    }
  }

  setRatingAttributesForModal(rating, mode, category, subcategory) {
    let naValue: any,
      rating_scale: any,
      selectedRating: any,
      selectedSubcategory: any;
    const newRating = {
      mode,
      attributes: {
        rating_id: rating.id,
        rating_name: rating.name,
        rating_status: rating.rating_status,
        rating_value: rating.rating_value,
        score_value: rating.score_value,
      },
      verifier:
        rating.review_assignments.length > 0
          ? { attributes: rating.review_assignments[0] }
          : undefined,
    };
    if (this.ratingLevel == ratingLevels.Section) {
      selectedSubcategory = this.ratingsBackup.find(
        (categoryBackup) => categoryBackup.id === subcategory.id
      );
      selectedRating = selectedSubcategory.ratings.find(
        (subcategoryBackup) => subcategoryBackup.id === rating.id
      );
    } else {
      const selectedCategory = this.ratingsBackup.find(
        (categoryBackup) => categoryBackup.id === category.id
      );
      selectedSubcategory = selectedCategory.ratings.find(
        (subcategoryBackup) => subcategoryBackup.id === subcategory.id
      );
      selectedRating = selectedSubcategory.ratings.find(
        (ratingBackup) => ratingBackup.id === rating.id
      );
    }
    rating_scale = this.ratingScaleDetailsMap.get(
      this.ratingDefinitionScaleIdMap.get(rating.id)
    ).rating_scales;
    naValue = this.ratingScaleDetailsMap.get(
      this.ratingDefinitionScaleIdMap.get(rating.id)
    ).naValue;
    if (rating.rating_status !== this.responseStatus.STARTED) {
      newRating.attributes.rating_value = selectedRating.rating_value;
    }
    return { newRating, rating_scale, naValue, selectedRating };
  }

  recordRating(rating: any, subcategory: any, category: any) {
    let value: any;
    if (rating.is_na) {
      value = null;
    } else if (
      this.ratingScaleDetailsMap.get(
        this.ratingDefinitionScaleIdMap.get(rating.id)
      ).rating_scales[0].scale_mode === this.ratingConstants.Absolute &&
      rating.rating_value
    ) {
      value = parseInt(rating.rating_value);
    } else if (
      this.ratingScaleDetailsMap.get(
        this.ratingDefinitionScaleIdMap.get(rating.id)
      ).rating_scales[0].scale_mode === this.ratingConstants.ScoreBand &&
      rating.score_value !== null &&
      rating.score_value !== undefined // allow 0 value for scoreband
    ) {
      value = parseInt(rating.score_value);
    } else {
      value = null;
    }

    const params = {
      value,
      entity_id: this.dueDiligenceID,
      entity_type: 'Duediligence',
      ratingCategoryID: rating.id,
      response_id: rating.response_id ? rating.response_id : undefined,
      is_na: rating.is_na,
    };

    this.http.put('ratings', params).subscribe((response: any) => {
      if (rating.is_na && this.custom_fields?.length) {
        // delete all custom fields if user marks rating is NA
        this.deleteCustomFields(rating);
      }
      this.updateValues(rating, subcategory, category, response);
      this.setColorCodes();
      this.ratingsBackup = [...this.ratings];
      this.toaster.success('Your rating/score has been recorded successfully');
      setTimeout(() => {
        this.ratingChanged = true;
      }, 2000);
    });
  }

  updateValues(rating: any, subcategory: any, category: any, response: any) {
    let targetRating;
    if (category) {
      targetRating = this.ratings
        .find((x) => x.id === category.id)
        .ratings.find((x) => x.id === subcategory.id)
        .ratings.find((x) => x.id === rating.id);
    } else {
      targetRating = this.ratings
        .find((x) => x.id === subcategory.id)
        .ratings.find((x) => x.id === rating.id);
    }
    targetRating.rating_value = response.value;
    targetRating.is_na = response.is_na;
    targetRating.updated_by_name = response.updated_by_name;
    targetRating.updated_at = response.updated_at;
  }

  saveCustomFields(rating: any, customFields: any) {
    const params = {
      entity_id: Number(this.dueDiligenceID),
      owner_user_id: this.current_user.id,
      entity_type: this.diligenceTypeId,
      schema_type: 'rating',
      sub_entity_id: rating.id,
      custom_fields: customFields,
    };

    if (params.custom_fields.length) {
      this.customFieldsService
        .saveCustomFields(params)
        .subscribe((response: any) => {
          this.toaster.success('Custom fields saved successfully');
        });
    }
  }

  deleteCustomFields(rating: any) {
    const payload = {
      entity_id: Number(this.dueDiligenceID),
      owner_user_id: this.current_user.id,
      entity_type: this.diligenceTypeId,
      schema_type: 'rating',
      sub_entity_id: rating.id,
    };

    this.customFieldsService
      .deleteCustomFields(payload)
      .subscribe((response: any) => {});
  }

  redirectToAddRatingTypes() {
    this.route.navigate(`app.firm.settings.investment_rating.types`);
  }

  toggleView(view: any) {
    this.view_mode = view;
  }

  redirectToInvestmentRatings() {
    this.route.navigate('app.firm.settings.investment_rating.types');
  }

  redirectToSummary() {
    this.route.navigateToRelativeRoute('summary', this.routeState);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
  
  getNoValueRatingName(rating) {
    const scaleData = this.ratingScaleDetailsMap.get(
      this.ratingDefinitionScaleIdMap.get(rating.id)
    );
    if (rating.is_na) {
      return scaleData.notRatedValue.name;
    }
    return scaleData.naValue.name;
  }

}
