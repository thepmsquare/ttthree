export interface RoomCreateRequestModel {
  user_id: string;
}

export interface RoomCreateResponseModel {
  room_code: string;
}

export interface RoomGetResponseModel {
  room_code: string;
  is_joinable: boolean;
}
